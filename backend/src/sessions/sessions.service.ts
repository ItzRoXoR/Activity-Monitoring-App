import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SessionsService {
  constructor(private db: DatabaseService) {}

  // format a session row into a response object
  private formatSession(row: any) {
    return {
      id: row.id,
      workoutId: row.workout_id,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      burnedCalories: row.burned_calories,
      completedEarly: row.completed_early,
    };
  }

  async startSession(userId: string, workoutId: string) {
    // make sure the workout exists
    const workoutResult = await this.db.query(
      'SELECT 1 FROM workouts WHERE id = $1',
      [workoutId],
    );
    const workoutNotFound = !workoutResult.rowCount || workoutResult.rowCount === 0;

    if (workoutNotFound) {
      throw new NotFoundException('workout not found');
    }

    const result = await this.db.query(
      `INSERT INTO workout_sessions (user_id, workout_id, started_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
      [userId, workoutId],
    );

    return this.formatSession(result.rows[0]);
  }

  async completeSession(userId: string, sessionId: string, burnedCalories: number, finishedAt?: string) {
    const finished = finishedAt || new Date().toISOString();

    const result = await this.db.query(
      `UPDATE workout_sessions
       SET finished_at = $1, burned_calories = $2, completed_early = FALSE
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [finished, burnedCalories, sessionId, userId],
    );

    const notFound = !result.rowCount || result.rowCount === 0;
    if (notFound) {
      throw new NotFoundException('session not found');
    }

    // also add the burned calories to today's activity
    const date = finished.slice(0, 10);
    await this.db.query(
      `INSERT INTO daily_activities (user_id, date, burned_calories)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET burned_calories = daily_activities.burned_calories + $3`,
      [userId, date, burnedCalories],
    );

    return this.formatSession(result.rows[0]);
  }

  async abandonSession(userId: string, sessionId: string) {
    const result = await this.db.query(
      `UPDATE workout_sessions
       SET finished_at = NOW(), completed_early = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [sessionId, userId],
    );

    const notFound = !result.rowCount || result.rowCount === 0;
    if (notFound) {
      throw new NotFoundException('session not found');
    }

    return this.formatSession(result.rows[0]);
  }
}
