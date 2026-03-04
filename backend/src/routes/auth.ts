import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../db/pool.ts";
import { LoginSchema, RegisterSchema } from "../schemas.ts";
import { validate, signToken } from "../middleware/auth.ts";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(RegisterSchema), async (req: Request, res: Response) => {
    try {
        const {
            name, username, password, gender, dateOfBirth,
            weightKg, heightCm, dailyStepsGoal, dailyCaloriesGoal,
        } = req.body;

        const exists = await pool.query("SELECT 1 FROM users WHERE username = $1", [username]);
        if (exists.rowCount && exists.rowCount > 0) {
            res.status(409).json({ error: "Username already taken" });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, username, password_hash, gender, date_of_birth,
                          weight_kg, height_cm, daily_steps_goal, daily_calories_goal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [name, username, passwordHash, gender, dateOfBirth,
                weightKg, heightCm, dailyStepsGoal, dailyCaloriesGoal]
        );

        const user = result.rows[0];
        const token = signToken(user.id);

        res.status(201).json({ token, user: formatUser(user) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/auth/login
router.post("/login", validate(LoginSchema), async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (!result.rowCount || result.rowCount === 0) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const token = signToken(user.id);
        res.json({ token, user: formatUser(user) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/auth/me  (check if authenticated)
router.get("/me", async (req: Request, res: Response) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        res.json({ authenticated: false });
        return;
    }
    try {
        const jwt = await import("jsonwebtoken");
        const secret = process.env.JWT_SECRET || "super-secret-university-project-key";
        const payload = jwt.default.verify(header.slice(7), secret) as { userId: string };
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
        if (!result.rowCount || result.rowCount === 0) {
            res.json({ authenticated: false });
            return;
        }
        res.json({ authenticated: true, user: formatUser(result.rows[0]) });
    } catch {
        res.json({ authenticated: false });
    }
});

function formatUser(row: any) {
    return {
        id: row.id,
        name: row.name,
        username: row.username,
        gender: row.gender,
        dateOfBirth: row.date_of_birth,
        weightKg: row.weight_kg,
        heightCm: row.height_cm,
        dailyStepsGoal: row.daily_steps_goal,
        dailyCaloriesGoal: row.daily_calories_goal,
        doNotDisturbUntil: row.do_not_disturb_until,
        doNotDisturbPermanently: row.do_not_disturb_permanently,
    };
}

export default router;
export { formatUser };
