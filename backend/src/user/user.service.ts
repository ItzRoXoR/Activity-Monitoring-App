import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto, UpdateGoalsDto } from './user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    private db: DatabaseService,
    private authService: AuthService,
  ) {}

  async getProfile(userId: string) {
    const result = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [userId],
    );
    const notFound = !result.rowCount || result.rowCount === 0;

    if (notFound) {
      throw new NotFoundException('user not found');
    }

    return this.authService.formatUser(result.rows[0]);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { gender, dateOfBirth, weightKg, heightCm, username, password } = dto;

    // build the set clauses dynamically based on which fields were provided
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (gender) { sets.push(`gender = $${idx++}`); vals.push(gender); }
    if (dateOfBirth) { sets.push(`date_of_birth = $${idx++}`); vals.push(dateOfBirth); }
    if (weightKg) { sets.push(`weight_kg = $${idx++}`); vals.push(weightKg); }
    if (heightCm) { sets.push(`height_cm = $${idx++}`); vals.push(heightCm); }
    if (username) { sets.push(`username = $${idx++}`); vals.push(username); }

    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      sets.push(`password_hash = $${idx++}`);
      vals.push(hash);
    }

    const nothingToUpdate = sets.length === 0;
    if (nothingToUpdate) {
      throw new BadRequestException('at least one field must be provided');
    }

    vals.push(userId);
    const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;

    try {
      const result = await this.db.query(query, vals);
      return this.authService.formatUser(result.rows[0]);
    } catch (err: any) {
      // unique constraint violation on username
      const isDuplicate = err?.code === '23505';
      if (isDuplicate) {
        throw new ConflictException('username already taken');
      }
      throw err;
    }
  }

  async updateGoals(userId: string, dto: UpdateGoalsDto) {
    const { stepsGoal, caloriesGoal } = dto;

    const result = await this.db.query(
      `UPDATE users SET daily_steps_goal = $1, daily_calories_goal = $2
       WHERE id = $3 RETURNING *`,
      [stepsGoal, caloriesGoal, userId],
    );

    return this.authService.formatUser(result.rows[0]);
  }

  async setDnd(userId: string, duration: string) {
    // map duration enum to sql interval
    const intervalMap: Record<string, string> = {
      ONE_DAY: `NOW() + INTERVAL '1 day'`,
      ONE_WEEK: `NOW() + INTERVAL '7 days'`,
      ONE_MONTH: `NOW() + INTERVAL '30 days'`,
    };

    const isPermanent = duration === 'PERMANENTLY';
    let sql: string;

    if (isPermanent) {
      sql = `UPDATE users SET do_not_disturb_until = NULL, do_not_disturb_permanently = TRUE
             WHERE id = $1 RETURNING *`;
    } else {
      const interval = intervalMap[duration];
      sql = `UPDATE users SET do_not_disturb_until = ${interval}, do_not_disturb_permanently = FALSE
             WHERE id = $1 RETURNING *`;
    }

    const result = await this.db.query(sql, [userId]);
    return this.authService.formatUser(result.rows[0]);
  }

  async clearDnd(userId: string) {
    const result = await this.db.query(
      `UPDATE users SET do_not_disturb_until = NULL, do_not_disturb_permanently = FALSE
       WHERE id = $1 RETURNING *`,
      [userId],
    );

    return this.authService.formatUser(result.rows[0]);
  }
}
