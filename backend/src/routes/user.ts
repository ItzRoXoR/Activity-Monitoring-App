import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import pool from "../db/pool.ts";
import { authMiddleware, validate } from "../middleware/auth.ts";
import { UpdateProfileSchema, UpdateGoalsSchema, SetDndSchema } from "../schemas.ts";
import { formatUser } from "./auth.ts";

const router = Router();
router.use(authMiddleware);

// GET /api/user
router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
        if (!result.rowCount) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json(formatUser(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PATCH /api/user/profile
router.patch("/profile", validate(UpdateProfileSchema), async (req: Request, res: Response) => {
    try {
        const { gender, dateOfBirth, weightKg, heightCm, username, password } = req.body;

        const sets: string[] = [];
        const vals: any[] = [];
        let idx = 1;

        if (gender) { sets.push(`gender = $${idx++}`); vals.push(gender); }
        if (dateOfBirth) { sets.push(`date_of_birth = $${idx++}`); vals.push(dateOfBirth); }
        if (weightKg) { sets.push(`weight_kg = $${idx++}`); vals.push(weightKg); }
        if (heightCm) { sets.push(`height_cm = $${idx++}`); vals.push(heightCm); }
        if (username) { sets.push(`username = $${idx++}`); vals.push(username); }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            sets.push(`password_hash = $${idx++}`);
            vals.push(hash);
        }

        if (sets.length === 0) {
            res.status(400).json({ error: "No fields to update" });
            return;
        }

        vals.push(req.userId);
        const result = await pool.query(
            `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
            vals
        );
        res.json(formatUser(result.rows[0]));
    } catch (err: any) {
        if (err?.code === "23505") {
            res.status(409).json({ error: "Username already taken" });
            return;
        }
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/user/goals
router.put("/goals", validate(UpdateGoalsSchema), async (req: Request, res: Response) => {
    try {
        const { stepsGoal, caloriesGoal } = req.body;
        const result = await pool.query(
            `UPDATE users SET daily_steps_goal = $1, daily_calories_goal = $2
       WHERE id = $3 RETURNING *`,
            [stepsGoal, caloriesGoal, req.userId]
        );
        res.json(formatUser(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/user/dnd
router.post("/dnd", validate(SetDndSchema), async (req: Request, res: Response) => {
    try {
        const { duration } = req.body;
        let sql: string;

        switch (duration) {
            case "ONE_DAY":
                sql = `UPDATE users SET do_not_disturb_until = NOW() + INTERVAL '1 day', do_not_disturb_permanently = FALSE WHERE id = $1 RETURNING *`;
                break;
            case "ONE_WEEK":
                sql = `UPDATE users SET do_not_disturb_until = NOW() + INTERVAL '7 days', do_not_disturb_permanently = FALSE WHERE id = $1 RETURNING *`;
                break;
            case "ONE_MONTH":
                sql = `UPDATE users SET do_not_disturb_until = NOW() + INTERVAL '30 days', do_not_disturb_permanently = FALSE WHERE id = $1 RETURNING *`;
                break;
            case "PERMANENTLY":
                sql = `UPDATE users SET do_not_disturb_until = NULL, do_not_disturb_permanently = TRUE WHERE id = $1 RETURNING *`;
                break;
            default:
                res.status(400).json({ error: "Invalid duration" });
                return;
        }

        const result = await pool.query(sql, [req.userId]);
        res.json(formatUser(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// DELETE /api/user/dnd
router.delete("/dnd", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE users SET do_not_disturb_until = NULL, do_not_disturb_permanently = FALSE
       WHERE id = $1 RETURNING *`,
            [req.userId]
        );
        res.json(formatUser(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
