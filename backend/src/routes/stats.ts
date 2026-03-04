import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

function periodToDays(period: string): number {
    switch (period) {
        case "DAY": return 1;
        case "WEEK": return 7;
        case "MONTH": return 30;
        default: return 7;
    }
}

// GET /api/stats/steps?period=DAY|WEEK|MONTH
router.get("/steps", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = periodToDays(period);

        const result = await pool.query(
            `SELECT date, steps as value FROM daily_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );

        const points = result.rows.map((r) => ({
            label: r.date.toISOString().slice(0, 10),
            value: r.value,
        }));

        const avg =
            points.length > 0
                ? points.reduce((s, p) => s + p.value, 0) / points.length
                : null;

        res.json({ points, averagePerDay: avg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/stats/calories?period=DAY|WEEK|MONTH
router.get("/calories", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = periodToDays(period);

        const result = await pool.query(
            `SELECT date, burned_calories as value FROM daily_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );

        const points = result.rows.map((r) => ({
            label: r.date.toISOString().slice(0, 10),
            value: r.value,
        }));

        const avg =
            points.length > 0
                ? points.reduce((s, p) => s + p.value, 0) / points.length
                : null;

        res.json({ points, averagePerDay: avg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/stats/distance?period=DAY|WEEK|MONTH
router.get("/distance", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = periodToDays(period);

        const result = await pool.query(
            `SELECT date, distance_km as value FROM daily_activities
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );

        const points = result.rows.map((r) => ({
            label: r.date.toISOString().slice(0, 10),
            value: r.value,
        }));

        const avg =
            points.length > 0
                ? points.reduce((s, p) => s + p.value, 0) / points.length
                : null;

        res.json({ points, averagePerDay: avg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/stats/weight?period=DAY|WEEK|MONTH
router.get("/weight", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = periodToDays(period);

        const result = await pool.query(
            `SELECT date, weight_kg as value FROM weight_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );

        const points = result.rows.map((r) => ({
            label: r.date.toISOString().slice(0, 10),
            value: r.value,
        }));

        const avg =
            points.length > 0
                ? points.reduce((s, p) => s + p.value, 0) / points.length
                : null;

        res.json({ points, averagePerDay: avg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/stats/bmi
router.get("/bmi", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT weight_kg, height_cm FROM users WHERE id = $1",
            [req.userId]
        );
        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const { weight_kg, height_cm } = result.rows[0];
        const heightM = height_cm / 100;
        const bmi = weight_kg / (heightM * heightM);

        let category: string;
        if (bmi < 18.5) category = "UNDERWEIGHT";
        else if (bmi < 25) category = "NORMAL";
        else if (bmi < 30) category = "OVERWEIGHT";
        else category = "OBESE";

        res.json({ bmi: Math.round(bmi * 100) / 100, category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
