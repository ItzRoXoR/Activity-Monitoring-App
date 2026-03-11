import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class WeightService {
  constructor(private db: DatabaseService) {}

  async logWeight(userId: string, weightKg: number, date?: string) {
    const entryDate = date || new Date().toISOString().slice(0, 10);

    // upsert the weight entry for this date
    const result = await this.db.query(
      `INSERT INTO weight_entries (user_id, date, weight_kg)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET weight_kg = $3
       RETURNING *`,
      [userId, entryDate, weightKg],
    );

    // also update the user's current weight field
    await this.db.query(
      'UPDATE users SET weight_kg = $1 WHERE id = $2',
      [weightKg, userId],
    );

    const row = result.rows[0];
    return { date: row.date, weightKg: row.weight_kg };
  }

  async getHistory(userId: string, period: string) {
    const daysMap: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30 };
    const days = daysMap[period] ?? 7;

    const result = await this.db.query(
      `SELECT * FROM weight_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
      [userId, days],
    );

    return result.rows.map((row) => ({
      date: row.date,
      weightKg: row.weight_kg,
    }));
  }

  async getLatest(userId: string) {
    const result = await this.db.query(
      'SELECT * FROM weight_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [userId],
    );

    const hasNoEntry = !result.rowCount || result.rowCount === 0;
    if (hasNoEntry) {
      return null;
    }

    const row = result.rows[0];
    return { date: row.date, weightKg: row.weight_kg };
  }
}
