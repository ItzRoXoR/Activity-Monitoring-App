import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ActivityService {
  constructor(private db: DatabaseService) {}

  async getTodayActivity(userId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const result = await this.db.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2',
      [userId, today],
    );

    const hasNoData = !result.rowCount || result.rowCount === 0;
    if (hasNoData) {
      return { date: today, steps: 0, burnedCalories: 0, distanceKm: 0 };
    }

    const row = result.rows[0];
    return {
      date: row.date,
      steps: row.steps,
      burnedCalories: row.burned_calories,
      distanceKm: row.distance_km,
    };
  }

  async getHistory(userId: string, period: string) {
    // convert period name to number of days
    const daysMap: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30 };
    const days = daysMap[period] ?? 7;

    const result = await this.db.query(
      `SELECT * FROM daily_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
      [userId, days],
    );

    return result.rows.map((row) => ({
      date: row.date,
      steps: row.steps,
      burnedCalories: row.burned_calories,
      distanceKm: row.distance_km,
    }));
  }

  async saveSteps(userId: string, totalStepsSinceBoot: number, timestamp: string) {
    const date = timestamp.slice(0, 10);
    const steps = totalStepsSinceBoot;

    // grab user's physical stats for distance/calorie calculation
    const userResult = await this.db.query(
      'SELECT weight_kg, height_cm FROM users WHERE id = $1',
      [userId],
    );
    const user = userResult.rows[0];

    // stride length is roughly 41.5% of height
    const strideMeters = (user.height_cm * 0.415) / 100;
    const distanceKm = (steps * strideMeters) / 1000;

    // rough calorie estimate scaled by body weight
    const calories = steps * 0.04 * (user.weight_kg / 70);

    await this.db.query(
      `INSERT INTO daily_activities (user_id, date, steps, burned_calories, distance_km)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date)
       DO UPDATE SET steps = $3, burned_calories = $4, distance_km = $5`,
      [userId, date, steps, calories, distanceKm],
    );

    return { date, steps, burnedCalories: calories, distanceKm };
  }

  async addCalories(userId: string, calories: number, timestamp?: string) {
    const date = (timestamp || new Date().toISOString()).slice(0, 10);

    await this.db.query(
      `INSERT INTO daily_activities (user_id, date, burned_calories)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET burned_calories = daily_activities.burned_calories + $3`,
      [userId, date, calories],
    );

    return { added: calories, date };
  }

  async upload(userId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const result = await this.db.query(
      'SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2',
      [userId, today],
    );

    const hasNoData = !result.rowCount || result.rowCount === 0;
    if (hasNoData) {
      return { message: 'no activity to upload', date: today };
    }

    // in production this would push to an analytics service
    const stepsToday = result.rows[0].steps;
    return { message: 'steps uploaded successfully', date: today, steps: stepsToday };
  }
}
