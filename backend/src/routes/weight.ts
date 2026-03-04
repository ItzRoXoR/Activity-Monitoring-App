import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware, validate } from "../middleware/auth.ts";
import { LogWeightSchema } from "../schemas.ts";

const router = Router();
router.use(authMiddleware);

// POST /api/weight
router.post("/", validate(LogWeightSchema), async (req: Request, res: Response) => {
    try {
        const { weightKg, date } = req.body;
        const entryDate = date || new Date().toISOString().slice(0, 10);

        const result = await pool.query(
            `INSERT INTO weight_entries (user_id, date, weight_kg)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET weight_kg = $3
       RETURNING *`,
            [req.userId, entryDate, weightKg]
        );

        // Also update user's current weight
        await pool.query("UPDATE users SET weight_kg = $1 WHERE id = $2", [weightKg, req.userId]);

        const r = result.rows[0];
        res.status(201).json({ date: r.date, weightKg: r.weight_kg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/weight/history?period=DAY|WEEK|MONTH
router.get("/history", async (req: Request, res: Response) => {
    try {
        const period = (req.query.period as string) || "WEEK";
        const days = period === "DAY" ? 1 : period === "WEEK" ? 7 : 30;
        const result = await pool.query(
            `SELECT * FROM weight_entries
       WHERE user_id = $1 AND date >= CURRENT_DATE - $2::int
       ORDER BY date ASC`,
            [req.userId, days]
        );
        res.json(result.rows.map((r) => ({ date: r.date, weightKg: r.weight_kg })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/weight/latest
router.get("/latest", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT * FROM weight_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 1`,
            [req.userId]
        );
        if (!result.rowCount || result.rowCount === 0) {
            res.json(null);
            return;
        }
        const r = result.rows[0];
        res.json({ date: r.date, weightKg: r.weight_kg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
