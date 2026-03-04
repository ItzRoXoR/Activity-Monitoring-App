import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware, validate } from "../middleware/auth.ts";
import { SaveStepsSchema, AddCaloriesSchema } from "../schemas.ts";

const router = Router();
router.use(authMiddleware);

// GET /api/activity/today
router.get("/today", async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const result = await pool.query(
            `SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2`,
            [req.userId, today]
        );
        if (!result.rowCount || result.rowCount === 0) {
            res.json({ date: today, steps: 0, burnedCalories: 0, distanceKm: 0 });
            return;
        }
        const r = result.rows[0];
        res.json({
            date: r.date,
            steps: r.steps,
            burnedCalories: r.burned_calories,
            distanceKm: r.distance_km,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/activity/history?period=DAY|WEEK|MONTH
router.get("/history", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = period === "DAY" ? 1 : period === "WEEK" ? 7 : 30;
        const result = await pool.query(
            `SELECT * FROM daily_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );
        res.json(
            result.rows.map((r) => ({
                date: r.date,
                steps: r.steps,
                burnedCalories: r.burned_calories,
                distanceKm: r.distance_km,
            }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/activity/steps  – called by step counter / upload worker
router.post("/steps", validate(SaveStepsSchema), async (req: Request, res: Response) => {
    try {
        const { totalStepsSinceBoot, timestamp } = req.body;
        const date = timestamp.slice(0, 10);

        // We simulate the baseline logic: the backend just stores the step count
        // The mobile client sends delta steps already computed
        const userResult = await pool.query(
            "SELECT weight_kg, height_cm FROM users WHERE id = $1",
            [req.userId]
        );
        const user = userResult.rows[0];
        const steps = totalStepsSinceBoot;

        // Calculate distance and calories from steps
        const strideM = (user.height_cm * 0.415) / 100;
        const distanceKm = (steps * strideM) / 1000;
        const calories = steps * 0.04 * (user.weight_kg / 70);

        await pool.query(
            `INSERT INTO daily_activities (user_id, date, steps, burned_calories, distance_km)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, date)
       DO UPDATE SET steps = $3, burned_calories = daily_activities.burned_calories + $4 - daily_activities.burned_calories, distance_km = $5`,
            [req.userId, date, steps, calories, distanceKm]
        );

        res.json({ date, steps, burnedCalories: calories, distanceKm });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/activity/calories  – add burned calories from workout
router.post("/calories", validate(AddCaloriesSchema), async (req: Request, res: Response) => {
    try {
        const { calories, timestamp } = req.body;
        const date = (timestamp || new Date().toISOString()).slice(0, 10);

        await pool.query(
            `INSERT INTO daily_activities (user_id, date, burned_calories)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET burned_calories = daily_activities.burned_calories + $3`,
            [req.userId, date, calories]
        );
        res.json({ added: calories, date });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/activity/upload  – simulates StepUploadWorker
router.post("/upload", async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const result = await pool.query(
            `SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2`,
            [req.userId, today]
        );
        if (!result.rowCount || result.rowCount === 0) {
            res.json({ message: "No activity to upload", date: today });
            return;
        }
        // In a real app this would push to a remote analytics backend.
        // Here we just acknowledge it.
        res.json({ message: "Steps uploaded successfully", date: today, steps: result.rows[0].steps });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
