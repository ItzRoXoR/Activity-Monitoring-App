import express from "express";
import "./db/pool.ts"; // load .env side-effects
import { getEnv } from "./db/pool.ts";
import authRoutes from "./routes/auth.ts";
import userRoutes from "./routes/user.ts";
import activityRoutes from "./routes/activity.ts";
import weightRoutes from "./routes/weight.ts";
import workoutRoutes from "./routes/workouts.ts";
import sessionRoutes from "./routes/sessions.ts";
import statsRoutes from "./routes/stats.ts";
import notificationRoutes from "./routes/notifications.ts";
import calorieRoutes from "./routes/calories.ts";

const app = express();

app.use(express.json());

// ── Health check ──
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/weight", weightRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calories", calorieRoutes);

// ── 404 fallback ──
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});

// ── Start ──
const port = parseInt(getEnv("PORT", "3000"), 10);
app.listen(port, () => {
    console.log(`Fitness backend running on http://localhost:${port}`);
    console.log("API routes:");
    console.log("  POST   /api/auth/register");
    console.log("  POST   /api/auth/login");
    console.log("  GET    /api/auth/me");
    console.log("  GET    /api/user");
    console.log("  PATCH  /api/user/profile");
    console.log("  PUT    /api/user/goals");
    console.log("  POST   /api/user/dnd");
    console.log("  DELETE /api/user/dnd");
    console.log("  GET    /api/activity/today");
    console.log("  GET    /api/activity/history?period=WEEK");
    console.log("  POST   /api/activity/steps");
    console.log("  POST   /api/activity/calories");
    console.log("  POST   /api/activity/upload");
    console.log("  POST   /api/weight");
    console.log("  GET    /api/weight/history?period=WEEK");
    console.log("  GET    /api/weight/latest");
    console.log("  GET    /api/workouts");
    console.log("  GET    /api/workouts/recommended");
    console.log("  GET    /api/workouts/favorites");
    console.log("  GET    /api/workouts/favorites/preview");
    console.log("  POST   /api/workouts/filter");
    console.log("  GET    /api/workouts/:id");
    console.log("  POST   /api/workouts/:id/favorite");
    console.log("  POST   /api/sessions/start");
    console.log("  PUT    /api/sessions/:id/complete");
    console.log("  PUT    /api/sessions/:id/abandon");
    console.log("  GET    /api/stats/steps?period=WEEK");
    console.log("  GET    /api/stats/calories?period=WEEK");
    console.log("  GET    /api/stats/distance?period=WEEK");
    console.log("  GET    /api/stats/weight?period=WEEK");
    console.log("  GET    /api/stats/bmi");
    console.log("  GET    /api/notifications");
    console.log("  PUT    /api/notifications/:id/read");
    console.log("  POST   /api/notifications/goal-reminder");
    console.log("  POST   /api/notifications/goal-achieved");
    console.log("  POST   /api/notifications/weight-reminder");
    console.log("  GET    /api/calories/exercise?met=&weightKg=&durationSeconds=");
    console.log("  GET    /api/calories/workout/:id?weightKg=");
    console.log("  GET    /api/calories/steps?steps=&weightKg=&heightCm=");
});
