import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware, validate } from "../middleware/auth.ts";
import { WorkoutFilterSchema } from "../schemas.ts";

const router = Router();

// Duration-range boundaries (matching Kotlin enum)
const DURATION_RANGES: Record<string, { min: number; max: number }> = {
    SHORT: { min: 5, max: 10 },
    MEDIUM: { min: 10, max: 15 },
    LONG: { min: 15, max: 20 },
    EXTENDED: { min: 20, max: 999999 },
};

async function loadWorkoutWithExercises(workoutId: string) {
    const exResult = await pool.query(
        `SELECT e.* FROM exercises e
     JOIN workout_exercises we ON we.exercise_id = e.id
     WHERE we.workout_id = $1
     ORDER BY we.sort_order`,
        [workoutId]
    );
    return exResult.rows.map((e) => ({
        id: e.id,
        title: e.title,
        muscleGroup: e.muscle_group,
        met: e.met,
        durationSeconds: e.duration_seconds,
        restAfterSeconds: e.rest_after_seconds,
        imageResId: e.image_res_id,
    }));
}

function formatWorkout(row: any, exercises: any[], isFavorite = false) {
    return {
        id: row.id,
        title: row.title,
        type: row.type,
        difficulty: row.difficulty,
        durationMinutes: row.duration_minutes,
        exercises,
        isFavorite,
    };
}

async function getWorkoutsWithExercises(rows: any[], userId?: string) {
    const favoriteIds = new Set<string>();
    if (userId) {
        const favResult = await pool.query(
            "SELECT workout_id FROM user_favorites WHERE user_id = $1",
            [userId]
        );
        favResult.rows.forEach((r) => favoriteIds.add(r.workout_id));
    }

    const workouts = [];
    for (const row of rows) {
        const exercises = await loadWorkoutWithExercises(row.id);
        workouts.push(formatWorkout(row, exercises, favoriteIds.has(row.id)));
    }
    return workouts;
}

// GET /api/workouts  – all workouts
router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM workouts ORDER BY title");
        const userId = req.userId; // may be undefined if not authed
        res.json(await getWorkoutsWithExercises(result.rows, userId));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/workouts/recommended
router.get("/recommended", async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(
            "SELECT * FROM workouts WHERE is_recommended = TRUE ORDER BY title"
        );
        res.json(await getWorkoutsWithExercises(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/workouts/favorites  (auth required)
router.get("/favorites", authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT w.* FROM workouts w
       JOIN user_favorites uf ON uf.workout_id = w.id
       WHERE uf.user_id = $1
       ORDER BY w.title`,
            [req.userId]
        );
        res.json(await getWorkoutsWithExercises(result.rows, req.userId));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/workouts/favorites/preview  (auth required, max 5)
router.get("/favorites/preview", authMiddleware, async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT w.* FROM workouts w
       JOIN user_favorites uf ON uf.workout_id = w.id
       WHERE uf.user_id = $1
       ORDER BY w.title LIMIT 5`,
            [req.userId]
        );
        res.json(await getWorkoutsWithExercises(result.rows, req.userId));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/workouts/filter
router.post("/filter", validate(WorkoutFilterSchema), async (req: Request, res: Response) => {
    try {
        const { types, muscleGroups, difficulties, durations } = req.body;

        let sql = "SELECT DISTINCT w.* FROM workouts w";
        const conditions: string[] = [];
        const params: any[] = [];
        let idx = 1;

        // If filtering by muscle group, join exercises
        if (muscleGroups && muscleGroups.length > 0) {
            sql += " JOIN workout_exercises we ON we.workout_id = w.id JOIN exercises e ON e.id = we.exercise_id";
            conditions.push(`e.muscle_group = ANY($${idx++})`);
            params.push(muscleGroups);
        }

        if (types && types.length > 0) {
            conditions.push(`w.type = ANY($${idx++})`);
            params.push(types);
        }

        if (difficulties && difficulties.length > 0) {
            conditions.push(`w.difficulty = ANY($${idx++})`);
            params.push(difficulties);
        }

        if (durations && durations.length > 0) {
            const durationConds: string[] = [];
            for (const d of durations) {
                const range = DURATION_RANGES[d];
                if (range) {
                    durationConds.push(`(w.duration_minutes >= ${range.min} AND w.duration_minutes <= ${range.max})`);
                }
            }
            if (durationConds.length > 0) {
                conditions.push(`(${durationConds.join(" OR ")})`);
            }
        }

        if (conditions.length > 0) {
            sql += " WHERE " + conditions.join(" AND ");
        }
        sql += " ORDER BY w.title";

        const result = await pool.query(sql, params);
        res.json(await getWorkoutsWithExercises(result.rows));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /api/workouts/:id
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM workouts WHERE id = $1", [req.params.id]);
        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({ error: "Workout not found" });
            return;
        }
        const id = req.params.id as string;
        const exercises = await loadWorkoutWithExercises(id);
        res.json(formatWorkout(result.rows[0], exercises));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/workouts/:id/favorite  (toggle)
router.post("/:id/favorite", authMiddleware, async (req: Request, res: Response) => {
    try {
        const workoutId = req.params.id;
        const exists = await pool.query(
            "SELECT 1 FROM user_favorites WHERE user_id = $1 AND workout_id = $2",
            [req.userId, workoutId]
        );

        if (exists.rowCount && exists.rowCount > 0) {
            await pool.query(
                "DELETE FROM user_favorites WHERE user_id = $1 AND workout_id = $2",
                [req.userId, workoutId]
            );
            res.json({ isFavorite: false });
        } else {
            await pool.query(
                "INSERT INTO user_favorites (user_id, workout_id) VALUES ($1, $2)",
                [req.userId, workoutId]
            );
            res.json({ isFavorite: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
