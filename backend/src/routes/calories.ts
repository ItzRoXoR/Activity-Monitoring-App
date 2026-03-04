import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";

const router = Router();

// GET /api/calories/exercise?met=X&weightKg=Y&durationSeconds=Z
router.get("/exercise", (req: Request, res: Response) => {
    const met = parseFloat(req.query.met as string);
    const weightKg = parseFloat(req.query.weightKg as string);
    const durationSeconds = parseInt(req.query.durationSeconds as string, 10);

    if (isNaN(met) || isNaN(weightKg) || isNaN(durationSeconds)) {
        res.status(400).json({ error: "met, weightKg, durationSeconds are required numbers" });
        return;
    }

    const calories = met * weightKg * (durationSeconds / 3600);
    res.json({ calories: Math.round(calories * 100) / 100 });
});

// GET /api/calories/workout/:id?weightKg=Y
router.get("/workout/:id", async (req: Request, res: Response) => {
    try {
        const weightKg = parseFloat(req.query.weightKg as string);
        if (isNaN(weightKg)) {
            res.status(400).json({ error: "weightKg query parameter is required" });
            return;
        }

        const exResult = await pool.query(
            `SELECT e.met, e.duration_seconds FROM exercises e
       JOIN workout_exercises we ON we.exercise_id = e.id
       WHERE we.workout_id = $1`,
            [req.params.id]
        );

        if (exResult.rowCount === 0) {
            res.status(404).json({ error: "Workout not found or has no exercises" });
            return;
        }

        let total = 0;
        for (const e of exResult.rows) {
            total += e.met * weightKg * (e.duration_seconds / 3600);
        }
        res.json({ calories: Math.round(total * 100) / 100 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/calories/steps?steps=X&weightKg=Y&heightCm=Z
router.get("/steps", (req: Request, res: Response) => {
    const steps = parseInt(req.query.steps as string, 10);
    const weightKg = parseFloat(req.query.weightKg as string);
    const heightCm = parseFloat(req.query.heightCm as string);

    if (isNaN(steps) || isNaN(weightKg) || isNaN(heightCm)) {
        res.status(400).json({ error: "steps, weightKg, heightCm are required numbers" });
        return;
    }

    const calories = steps * 0.04 * (weightKg / 70);
    const strideM = (heightCm * 0.415) / 100;
    const distanceKm = (steps * strideM) / 1000;

    res.json({
        calories: Math.round(calories * 100) / 100,
        distanceKm: Math.round(distanceKm * 1000) / 1000,
    });
});

export default router;
