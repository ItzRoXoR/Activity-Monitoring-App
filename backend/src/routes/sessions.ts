import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware, validate } from "../middleware/auth.ts";
import { StartSessionSchema, CompleteSessionSchema } from "../schemas.ts";

const router = Router();
router.use(authMiddleware);

// POST /api/sessions/start
router.post("/start", validate(StartSessionSchema), async (req: Request, res: Response) => {
    try {
        const { workoutId } = req.body;

        // verify workout exists
        const w = await pool.query("SELECT 1 FROM workouts WHERE id = $1", [workoutId]);
        if (!w.rowCount || w.rowCount === 0) {
            res.status(404).json({ error: "Workout not found" });
            return;
        }

        const result = await pool.query(
            `INSERT INTO workout_sessions (user_id, workout_id, started_at)
       VALUES ($1, $2, NOW()) RETURNING *`,
            [req.userId, workoutId]
        );

        const s = result.rows[0];
        res.status(201).json({
            id: s.id,
            workoutId: s.workout_id,
            startedAt: s.started_at,
            finishedAt: s.finished_at,
            burnedCalories: s.burned_calories,
            completedEarly: s.completed_early,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/sessions/:id/complete
router.put("/:id/complete", validate(CompleteSessionSchema), async (req: Request, res: Response) => {
    try {
        const { burnedCalories, finishedAt } = req.body;
        const finished = finishedAt || new Date().toISOString();

        const result = await pool.query(
            `UPDATE workout_sessions
       SET finished_at = $1, burned_calories = $2, completed_early = FALSE
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
            [finished, burnedCalories, req.params.id, req.userId]
        );

        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        // Add burned calories to daily activity
        const date = finished.slice(0, 10);
        await pool.query(
            `INSERT INTO daily_activities (user_id, date, burned_calories)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, date)
       DO UPDATE SET burned_calories = daily_activities.burned_calories + $3`,
            [req.userId, date, burnedCalories]
        );

        const s = result.rows[0];
        res.json({
            id: s.id,
            workoutId: s.workout_id,
            startedAt: s.started_at,
            finishedAt: s.finished_at,
            burnedCalories: s.burned_calories,
            completedEarly: s.completed_early,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/sessions/:id/abandon
router.put("/:id/abandon", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE workout_sessions
       SET finished_at = NOW(), completed_early = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [req.params.id, req.userId]
        );

        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({ error: "Session not found" });
            return;
        }

        const s = result.rows[0];
        res.json({
            id: s.id,
            workoutId: s.workout_id,
            startedAt: s.started_at,
            finishedAt: s.finished_at,
            burnedCalories: s.burned_calories,
            completedEarly: s.completed_early,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
