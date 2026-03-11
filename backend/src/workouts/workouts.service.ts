import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// duration range boundaries matching the mobile enum
const DURATION_RANGES: Record<string, { min: number; max: number }> = {
  SHORT: { min: 5, max: 10 },
  MEDIUM: { min: 10, max: 15 },
  LONG: { min: 15, max: 20 },
  EXTENDED: { min: 20, max: 999999 },
};

@Injectable()
export class WorkoutsService {
  constructor(private db: DatabaseService) {}

  // load exercises for a single workout
  private async loadExercises(workoutId: string) {
    const result = await this.db.query(
      `SELECT e.* FROM exercises e
       JOIN workout_exercises we ON we.exercise_id = e.id
       WHERE we.workout_id = $1
       ORDER BY we.sort_order`,
      [workoutId],
    );

    return result.rows.map((e) => ({
      id: e.id,
      title: e.title,
      muscleGroup: e.muscle_group,
      met: e.met,
      durationSeconds: e.duration_seconds,
      restAfterSeconds: e.rest_after_seconds,
      imageResId: e.image_res_id,
    }));
  }

  // format a workout row + exercises + optional favorite flag
  private formatWorkout(row: any, exercises: any[], isFavorite = false) {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      difficulty: row.difficulty,
      durationMinutes: row.duration_minutes,
      exercises,
      isFavorite,
    };
  }

  // take a list of raw workout rows and hydrate them with exercises + favorites
  private async hydrateWorkouts(rows: any[], userId?: string) {
    // collect user's favorite workout ids
    const favoriteIds = new Set<string>();
    if (userId) {
      const favResult = await this.db.query(
        'SELECT workout_id FROM user_favorites WHERE user_id = $1',
        [userId],
      );
      favResult.rows.forEach((r) => favoriteIds.add(r.workout_id));
    }

    const workouts = [];
    for (const row of rows) {
      const exercises = await this.loadExercises(row.id);
      const isFav = favoriteIds.has(row.id);
      workouts.push(this.formatWorkout(row, exercises, isFav));
    }
    return workouts;
  }

  async getAll(userId?: string) {
    const result = await this.db.query('SELECT * FROM workouts ORDER BY title');
    return this.hydrateWorkouts(result.rows, userId);
  }

  async getRecommended() {
    const result = await this.db.query(
      'SELECT * FROM workouts WHERE is_recommended = TRUE ORDER BY title',
    );
    return this.hydrateWorkouts(result.rows);
  }

  async getFavorites(userId: string) {
    const result = await this.db.query(
      `SELECT w.* FROM workouts w
       JOIN user_favorites uf ON uf.workout_id = w.id
       WHERE uf.user_id = $1
       ORDER BY w.title`,
      [userId],
    );
    return this.hydrateWorkouts(result.rows, userId);
  }

  async getFavoritesPreview(userId: string) {
    const result = await this.db.query(
      `SELECT w.* FROM workouts w
       JOIN user_favorites uf ON uf.workout_id = w.id
       WHERE uf.user_id = $1
       ORDER BY w.title LIMIT 5`,
      [userId],
    );
    return this.hydrateWorkouts(result.rows, userId);
  }

  async filter(dto: { types?: string[]; muscleGroups?: string[]; difficulties?: string[]; durations?: string[] }) {
    const types = dto.types ?? [];
    const muscleGroups = dto.muscleGroups ?? [];
    const difficulties = dto.difficulties ?? [];
    const durations = dto.durations ?? [];

    let sql = 'SELECT DISTINCT w.* FROM workouts w';
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    // join exercises table only if filtering by muscle group
    const needsMuscleJoin = muscleGroups.length > 0;
    if (needsMuscleJoin) {
      sql += ' JOIN workout_exercises we ON we.workout_id = w.id JOIN exercises e ON e.id = we.exercise_id';
      conditions.push(`e.muscle_group = ANY($${idx++})`);
      params.push(muscleGroups);
    }

    if (types.length > 0) {
      conditions.push(`w.type = ANY($${idx++})`);
      params.push(types);
    }

    if (difficulties.length > 0) {
      conditions.push(`w.difficulty = ANY($${idx++})`);
      params.push(difficulties);
    }

    if (durations.length > 0) {
      const durationClauses: string[] = [];
      for (const d of durations) {
        const range = DURATION_RANGES[d];
        if (range) {
          durationClauses.push(
            `(w.duration_minutes >= ${range.min} AND w.duration_minutes <= ${range.max})`,
          );
        }
      }
      const hasDurationFilters = durationClauses.length > 0;
      if (hasDurationFilters) {
        conditions.push(`(${durationClauses.join(' OR ')})`);
      }
    }

    const hasConditions = conditions.length > 0;
    if (hasConditions) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY w.title';

    const result = await this.db.query(sql, params);
    return this.hydrateWorkouts(result.rows);
  }

  async getById(workoutId: string) {
    const result = await this.db.query(
      'SELECT * FROM workouts WHERE id = $1',
      [workoutId],
    );

    const notFound = !result.rowCount || result.rowCount === 0;
    if (notFound) {
      throw new NotFoundException('workout not found');
    }

    const exercises = await this.loadExercises(workoutId);
    return this.formatWorkout(result.rows[0], exercises);
  }

  async toggleFavorite(userId: string, workoutId: string) {
    // check if already favorited
    const exists = await this.db.query(
      'SELECT 1 FROM user_favorites WHERE user_id = $1 AND workout_id = $2',
      [userId, workoutId],
    );

    const alreadyFavorited = (exists.rowCount ?? 0) > 0;

    if (alreadyFavorited) {
      await this.db.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND workout_id = $2',
        [userId, workoutId],
      );
      return { isFavorite: false };
    }

    await this.db.query(
      'INSERT INTO user_favorites (user_id, workout_id) VALUES ($1, $2)',
      [userId, workoutId],
    );
    return { isFavorite: true };
  }
}
