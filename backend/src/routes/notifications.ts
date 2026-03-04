import { Router } from "express";
import type { Request, Response } from "express";
import pool from "../db/pool.ts";
import { authMiddleware } from "../middleware/auth.ts";

const router = Router();
router.use(authMiddleware);

// GET /api/notifications
router.get("/", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications
       WHERE user_id = $1 AND is_read = FALSE
       ORDER BY created_at DESC`,
            [req.userId]
        );
        res.json(
            result.rows.map((r) => ({
                id: r.id,
                type: r.type,
                message: r.message,
                createdAt: r.created_at,
                isRead: r.is_read,
            }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING *`,
            [req.params.id, req.userId]
        );
        if (!result.rowCount || result.rowCount === 0) {
            res.status(404).json({ error: "Notification not found" });
            return;
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/notifications/goal-reminder  – simulates GoalReminderWorker
router.post("/goal-reminder", async (req: Request, res: Response) => {
    try {
        // 1. Get user
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
        const user = userResult.rows[0];

        // 2. Check DnD
        if (user.do_not_disturb_permanently) {
            res.json({ posted: false, reason: "Do Not Disturb is permanently enabled" });
            return;
        }
        if (user.do_not_disturb_until && new Date(user.do_not_disturb_until) > new Date()) {
            res.json({ posted: false, reason: "Do Not Disturb is active" });
            return;
        }

        // 3. Get today's activity
        const today = new Date().toISOString().slice(0, 10);
        const actResult = await pool.query(
            `SELECT * FROM daily_activities WHERE user_id = $1 AND date = $2`,
            [req.userId, today]
        );
        const activity = actResult.rows[0] || { steps: 0, burned_calories: 0 };

        // 4. Check goals
        const stepsUnmet = activity.steps < user.daily_steps_goal;
        const caloriesUnmet = activity.burned_calories < user.daily_calories_goal;

        if (!stepsUnmet && !caloriesUnmet) {
            res.json({ posted: false, reason: "All goals already met!" });
            return;
        }

        // 5. Build message
        const parts: string[] = [];
        if (stepsUnmet) parts.push(`steps (${activity.steps}/${user.daily_steps_goal})`);
        if (caloriesUnmet) parts.push(`calories (${Math.round(activity.burned_calories)}/${user.daily_calories_goal})`);
        const message = `You haven't achieved your daily ${parts.join(" and ")} goal yet. Keep going!`;

        // 6. Save notification
        await pool.query(
            `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
            [req.userId, "GOAL_NOT_ACHIEVED", message]
        );

        res.json({ posted: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/notifications/goal-achieved  – simulates postGoalAchievedNotification
router.post("/goal-achieved", async (req: Request, res: Response) => {
    try {
        const message = "Congratulations! You've achieved your daily fitness goal! 🎉";
        await pool.query(
            `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
            [req.userId, "GOAL_ACHIEVED", message]
        );
        res.json({ posted: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /api/notifications/weight-reminder  – simulates WeightReminderWorker
router.post("/weight-reminder", async (req: Request, res: Response) => {
    try {
        // Check DnD
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
        const user = userResult.rows[0];

        if (user.do_not_disturb_permanently) {
            res.json({ posted: false, reason: "Do Not Disturb is permanently enabled" });
            return;
        }
        if (user.do_not_disturb_until && new Date(user.do_not_disturb_until) > new Date()) {
            res.json({ posted: false, reason: "Do Not Disturb is active" });
            return;
        }

        const message = "Good morning! Don't forget to log your weight today.";
        await pool.query(
            `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
            [req.userId, "WEIGHT_REMINDER", message]
        );
        res.json({ posted: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
