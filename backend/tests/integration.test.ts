/**
 * Integration tests for the Fitness Backend API.
 * Uses Node.js built-in test runner (node:test) + node:assert — no extra deps.
 *
 * Run:  node --test tests/integration.test.ts
 * (server must be running on localhost:3000)
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import pool from "../src/db/pool.ts";

const BASE = process.env.API_URL ?? "http://localhost:3000";

// ── helpers ──────────────────────────────────────────────────────────────────

async function req(
    method: string,
    path: string,
    body?: unknown,
    token?: string
): Promise<{ status: number; body: any }> {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let parsed: any;
    try {
        parsed = JSON.parse(text);
    } catch {
        parsed = text;
    }
    return { status: res.status, body: parsed };
}

// ── shared state ──────────────────────────────────────────────────────────────

const TEST_USER = {
    name: "Test User",
    username: `testuser_${Date.now()}`,
    password: "testpass",
    gender: "FEMALE",
    dateOfBirth: "1995-06-20",
    weightKg: 65,
    heightCm: 168,
    dailyStepsGoal: 8000,
    dailyCaloriesGoal: 400,
};

let token = "";
let userId = "";
let workoutId = "";
let sessionId = "";
let notificationId = "";

// ── clean up test user after all tests ────────────────────────────────────────

after(async () => {
    if (userId) {
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
    }
    await pool.end();
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Health", () => {
    it("GET /api/health → 200", async () => {
        const { status, body } = await req("GET", "/api/health");
        assert.equal(status, 200);
        assert.equal(body.status, "ok");
        assert.ok(body.timestamp);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Auth", () => {
    it("register a new user → 201", async () => {
        const { status, body } = await req("POST", "/api/auth/register", TEST_USER);
        assert.equal(status, 201);
        assert.ok(body.token, "token should be present");
        assert.equal(body.user.username, TEST_USER.username);
        assert.equal(body.user.gender, TEST_USER.gender);
        token = body.token;
        userId = body.user.id;
    });

    it("register duplicate username → 409", async () => {
        const { status } = await req("POST", "/api/auth/register", TEST_USER);
        assert.equal(status, 409);
    });

    it("login with correct credentials → 200", async () => {
        const { status, body } = await req("POST", "/api/auth/login", {
            username: TEST_USER.username,
            password: TEST_USER.password,
        });
        assert.equal(status, 200);
        assert.ok(body.token);
        token = body.token; // refresh token
    });

    it("login with wrong password → 401", async () => {
        const { status } = await req("POST", "/api/auth/login", {
            username: TEST_USER.username,
            password: "wrongpassword",
        });
        assert.equal(status, 401);
    });

    it("login with unknown username → 401", async () => {
        const { status } = await req("POST", "/api/auth/login", {
            username: "nobody",
            password: "x",
        });
        assert.equal(status, 401);
    });

    it("GET /api/auth/me with valid token → authenticated", async () => {
        const { status, body } = await req("GET", "/api/auth/me", undefined, token);
        assert.equal(status, 200);
        assert.equal(body.authenticated, true);
        assert.equal(body.user.username, TEST_USER.username);
    });

    it("GET /api/auth/me with invalid token → not authenticated", async () => {
        const { status, body } = await req("GET", "/api/auth/me", undefined, "badtoken");
        assert.equal(status, 200);
        assert.equal(body.authenticated, false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("User profile", () => {
    it("GET /api/user → own profile", async () => {
        const { status, body } = await req("GET", "/api/user", undefined, token);
        assert.equal(status, 200);
        assert.equal(body.username, TEST_USER.username);
    });

    it("GET /api/user without token → 401", async () => {
        const { status } = await req("GET", "/api/user");
        assert.equal(status, 401);
    });

    it("PATCH /api/user/profile → update weight", async () => {
        const { status, body } = await req(
            "PATCH",
            "/api/user/profile",
            { weightKg: 63.5 },
            token
        );
        assert.equal(status, 200);
        assert.equal(body.weightKg, 63.5);
    });

    it("PATCH /api/user/profile with empty body → 400", async () => {
        const { status } = await req("PATCH", "/api/user/profile", {}, token);
        assert.equal(status, 400);
    });

    it("PUT /api/user/goals → update goals", async () => {
        const { status, body } = await req(
            "PUT",
            "/api/user/goals",
            { stepsGoal: 12000, caloriesGoal: 600 },
            token
        );
        assert.equal(status, 200);
        assert.equal(body.dailyStepsGoal, 12000);
        assert.equal(body.dailyCaloriesGoal, 600);
    });

    it("POST /api/user/dnd → set one-day DnD", async () => {
        const { status, body } = await req(
            "POST",
            "/api/user/dnd",
            { duration: "ONE_DAY" },
            token
        );
        assert.equal(status, 200);
        assert.ok(body.doNotDisturbUntil, "doNotDisturbUntil should be set");
    });

    it("DELETE /api/user/dnd → clear DnD", async () => {
        const { status, body } = await req("DELETE", "/api/user/dnd", undefined, token);
        assert.equal(status, 200);
        assert.equal(body.doNotDisturbUntil, null);
        assert.equal(body.doNotDisturbPermanently, false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Workouts", () => {
    it("GET /api/workouts → array of workouts", async () => {
        const { status, body } = await req("GET", "/api/workouts");
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        assert.ok(body.length > 0, "should have seeded workouts");
        // pick a workout for later tests
        workoutId = body[0].id;
        // shape check
        const w = body[0];
        assert.ok(w.id);
        assert.ok(w.title);
        assert.ok(w.type);
        assert.ok(w.difficulty);
        assert.ok(typeof w.durationMinutes === "number");
        assert.ok(Array.isArray(w.exercises));
    });

    it("GET /api/workouts/recommended → only recommended workouts", async () => {
        const { status, body } = await req("GET", "/api/workouts/recommended");
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        assert.ok(body.length > 0, "should return recommended workouts");
    });

    it("GET /api/workouts/:id → single workout with exercises", async () => {
        const { status, body } = await req("GET", `/api/workouts/${workoutId}`);
        assert.equal(status, 200);
        assert.equal(body.id, workoutId);
        assert.ok(body.exercises.length > 0);
        // exercise shape check
        const e = body.exercises[0];
        assert.ok(e.id);
        assert.ok(e.title);
        assert.ok(e.muscleGroup);
        assert.ok(typeof e.met === "number");
        assert.ok(typeof e.durationSeconds === "number");
    });

    it("GET /api/workouts/unknown-id → 404", async () => {
        const { status } = await req("GET", "/api/workouts/00000000-0000-0000-0000-000000000000");
        assert.equal(status, 404);
    });

    it("POST /api/workouts/filter by HIIT type → filtered list", async () => {
        const { status, body } = await req("POST", "/api/workouts/filter", { types: ["HIIT"] });
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        for (const w of body) {
            assert.equal(w.type, "HIIT");
        }
    });

    it("POST /api/workouts/filter by HARD difficulty", async () => {
        const { status, body } = await req("POST", "/api/workouts/filter", {
            difficulties: ["HARD"],
        });
        assert.equal(status, 200);
        for (const w of body) {
            assert.equal(w.difficulty, "HARD");
        }
    });

    it("POST /api/workouts/filter empty filter → all workouts", async () => {
        const { status, body } = await req("POST", "/api/workouts/filter", {});
        assert.equal(status, 200);
        assert.ok(body.length > 0);
    });

    it("POST /api/workouts/:id/favorite → toggle on", async () => {
        const { status, body } = await req(
            "POST",
            `/api/workouts/${workoutId}/favorite`,
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.isFavorite, true);
    });

    it("POST /api/workouts/:id/favorite → toggle off", async () => {
        const { status, body } = await req(
            "POST",
            `/api/workouts/${workoutId}/favorite`,
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.isFavorite, false);
    });

    it("GET /api/workouts/favorites → empty after removing favorite", async () => {
        const { status, body } = await req(
            "GET",
            "/api/workouts/favorites",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        // no favorites right now (we removed it)
        assert.equal(body.find((w: any) => w.id === workoutId), undefined);
    });

    it("GET /api/workouts/favorites/preview → requires auth", async () => {
        const { status } = await req("GET", "/api/workouts/favorites/preview");
        assert.equal(status, 401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Workout Sessions", () => {
    it("POST /api/sessions/start → creates a session", async () => {
        const { status, body } = await req(
            "POST",
            "/api/sessions/start",
            { workoutId },
            token
        );
        assert.equal(status, 201);
        assert.ok(body.id);
        assert.equal(body.workoutId, workoutId);
        assert.ok(body.startedAt);
        assert.equal(body.finishedAt, null);
        sessionId = body.id;
    });

    it("POST /api/sessions/start with invalid workoutId → 404", async () => {
        const { status } = await req(
            "POST",
            "/api/sessions/start",
            { workoutId: "00000000-0000-0000-0000-000000000000" },
            token
        );
        assert.equal(status, 404);
    });

    it("PUT /api/sessions/:id/complete → finishes the session", async () => {
        const { status, body } = await req(
            "PUT",
            `/api/sessions/${sessionId}/complete`,
            { burnedCalories: 150.0 },
            token
        );
        assert.equal(status, 200);
        assert.ok(body.finishedAt);
        assert.equal(body.burnedCalories, 150);
        assert.equal(body.completedEarly, false);
    });

    it("PUT /api/sessions/:id/complete non-existent → 404", async () => {
        const { status } = await req(
            "PUT",
            "/api/sessions/00000000-0000-0000-0000-000000000000/complete",
            { burnedCalories: 100 },
            token
        );
        assert.equal(status, 404);
    });

    it("PUT /api/sessions/:id/abandon → marks completedEarly=true", async () => {
        // start new session to abandon
        const { body: started } = await req(
            "POST",
            "/api/sessions/start",
            { workoutId },
            token
        );
        const { status, body } = await req(
            "PUT",
            `/api/sessions/${started.id}/abandon`,
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.completedEarly, true);
        assert.ok(body.finishedAt);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Activity", () => {
    it("GET /api/activity/today → empty activity", async () => {
        const { status, body } = await req("GET", "/api/activity/today", undefined, token);
        assert.equal(status, 200);
        assert.ok("steps" in body);
        assert.ok("burnedCalories" in body);
        assert.ok("distanceKm" in body);
    });

    it("POST /api/activity/steps → saves steps", async () => {
        const { status, body } = await req(
            "POST",
            "/api/activity/steps",
            { totalStepsSinceBoot: 5000, timestamp: new Date().toISOString() },
            token
        );
        assert.equal(status, 200);
        assert.equal(body.steps, 5000);
        assert.ok(body.distanceKm > 0);
    });

    it("POST /api/activity/calories → adds burned calories", async () => {
        const { status, body } = await req(
            "POST",
            "/api/activity/calories",
            { calories: 200 },
            token
        );
        assert.equal(status, 200);
        assert.equal(body.added, 200);
    });

    it("GET /api/activity/today → reflects saved steps", async () => {
        const { status, body } = await req("GET", "/api/activity/today", undefined, token);
        assert.equal(status, 200);
        assert.equal(body.steps, 5000);
    });

    it("GET /api/activity/history → array by period", async () => {
        const { status, body } = await req(
            "GET",
            "/api/activity/history?period=WEEK",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
    });

    it("POST /api/activity/upload → simulates upload worker", async () => {
        const { status, body } = await req("POST", "/api/activity/upload", undefined, token);
        assert.equal(status, 200);
        assert.ok(body.message);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Weight", () => {
    it("GET /api/weight/latest → null (no entries yet)", async () => {
        const { status, body } = await req("GET", "/api/weight/latest", undefined, token);
        assert.equal(status, 200);
        // could be null or an entry from session complete
        assert.ok(body === null || typeof body.weightKg === "number");
    });

    it("POST /api/weight → logs a weight entry", async () => {
        const { status, body } = await req(
            "POST",
            "/api/weight",
            { weightKg: 64.0 },
            token
        );
        assert.equal(status, 201);
        assert.equal(body.weightKg, 64);
    });

    it("POST /api/weight same day → updates (upsert)", async () => {
        const { status, body } = await req(
            "POST",
            "/api/weight",
            { weightKg: 63.8 },
            token
        );
        assert.equal(status, 201);
        assert.equal(body.weightKg, 63.8);
    });

    it("GET /api/weight/latest → returns latest entry", async () => {
        const { status, body } = await req("GET", "/api/weight/latest", undefined, token);
        assert.equal(status, 200);
        assert.ok(body !== null);
        assert.equal(body.weightKg, 63.8);
    });

    it("GET /api/weight/history → list by period", async () => {
        const { status, body } = await req(
            "GET",
            "/api/weight/history?period=WEEK",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        assert.ok(body.length >= 1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Statistics", () => {
    it("GET /api/stats/steps → chart data", async () => {
        const { status, body } = await req("GET", "/api/stats/steps?period=WEEK", undefined, token);
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.points));
        // averagePerDay may be null or number
        assert.ok(body.averagePerDay === null || typeof body.averagePerDay === "number");
    });

    it("GET /api/stats/calories → chart data", async () => {
        const { status, body } = await req(
            "GET",
            "/api/stats/calories?period=MONTH",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.points));
    });

    it("GET /api/stats/distance → chart data", async () => {
        const { status, body } = await req(
            "GET",
            "/api/stats/distance?period=DAY",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.points));
    });

    it("GET /api/stats/weight → chart data", async () => {
        const { status, body } = await req(
            "GET",
            "/api/stats/weight?period=WEEK",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.ok(Array.isArray(body.points));
        // we logged weight, so there should be at least 1 point
        assert.ok(body.points.length >= 1);
    });

    it("GET /api/stats/bmi → bmi value and category", async () => {
        const { status, body } = await req("GET", "/api/stats/bmi", undefined, token);
        assert.equal(status, 200);
        assert.ok(typeof body.bmi === "number");
        assert.ok(body.bmi > 0);
        assert.ok(["UNDERWEIGHT", "NORMAL", "OVERWEIGHT", "OBESE"].includes(body.category));
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Calorie Calculator", () => {
    it("GET /api/calories/exercise → numeric result", async () => {
        const { status, body } = await req(
            "GET",
            "/api/calories/exercise?met=8&weightKg=65&durationSeconds=60"
        );
        assert.equal(status, 200);
        assert.ok(typeof body.calories === "number");
        assert.ok(body.calories > 0);
        // MET=8, 65kg, 60s => 8 * 65 * (60/3600) ≈ 8.67
        assert.ok(Math.abs(body.calories - 8.67) < 1);
    });

    it("GET /api/calories/exercise missing params → 400", async () => {
        const { status } = await req("GET", "/api/calories/exercise?met=8");
        assert.equal(status, 400);
    });

    it("GET /api/calories/steps → calories and distance", async () => {
        const { status, body } = await req(
            "GET",
            "/api/calories/steps?steps=10000&weightKg=65&heightCm=168"
        );
        assert.equal(status, 200);
        assert.ok(typeof body.calories === "number");
        assert.ok(typeof body.distanceKm === "number");
        assert.ok(body.distanceKm > 0);
    });

    it("GET /api/calories/workout/:id → total workout calories", async () => {
        const { status, body } = await req(`GET`, `/api/calories/workout/${workoutId}?weightKg=65`);
        assert.equal(status, 200);
        assert.ok(typeof body.calories === "number");
        assert.ok(body.calories > 0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Notifications", () => {
    it("GET /api/notifications → empty initially", async () => {
        const { status, body } = await req("GET", "/api/notifications", undefined, token);
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
    });

    it("POST /api/notifications/weight-reminder → posts notification", async () => {
        const { status, body } = await req(
            "POST",
            "/api/notifications/weight-reminder",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.posted, true);
        assert.ok(body.message);
    });

    it("POST /api/notifications/goal-achieved → posts notification", async () => {
        const { status, body } = await req(
            "POST",
            "/api/notifications/goal-achieved",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.posted, true);
    });

    it("POST /api/notifications/goal-reminder → posts since goals not fully met", async () => {
        const { status, body } = await req(
            "POST",
            "/api/notifications/goal-reminder",
            undefined,
            token
        );
        assert.equal(status, 200);
        // may or may not post depending on steps/calories saved above vs goals
        assert.ok(typeof body.posted === "boolean");
    });

    it("GET /api/notifications → shows unread notifications", async () => {
        const { status, body } = await req("GET", "/api/notifications", undefined, token);
        assert.equal(status, 200);
        assert.ok(Array.isArray(body));
        assert.ok(body.length >= 2, "should have at least 2 notifications");
        // shape check
        const n = body[0];
        assert.ok(n.id);
        assert.ok(n.type);
        assert.ok(n.message);
        assert.ok(n.createdAt);
        assert.equal(n.isRead, false);
        notificationId = n.id;
    });

    it("PUT /api/notifications/:id/read → marks as read", async () => {
        const { status, body } = await req(
            "PUT",
            `/api/notifications/${notificationId}/read`,
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.success, true);
    });

    it("GET /api/notifications → read notification no longer appears", async () => {
        const { status, body } = await req("GET", "/api/notifications", undefined, token);
        assert.equal(status, 200);
        const found = body.find((n: any) => n.id === notificationId);
        assert.equal(found, undefined, "read notification should not appear in unread list");
    });

    it("PUT /api/notifications/unknown-id/read → 404", async () => {
        const { status } = await req(
            "PUT",
            "/api/notifications/00000000-0000-0000-0000-000000000000/read",
            undefined,
            token
        );
        assert.equal(status, 404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("DnD blocks notifications", () => {
    it("set DnD PERMANENTLY → notifications blocked", async () => {
        await req("POST", "/api/user/dnd", { duration: "PERMANENTLY" }, token);

        const { status, body } = await req(
            "POST",
            "/api/notifications/goal-reminder",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.posted, false);
        assert.ok(body.reason?.includes("permanently"), "should mention permanently");
    });

    it("weight-reminder also blocked by DnD", async () => {
        const { status, body } = await req(
            "POST",
            "/api/notifications/weight-reminder",
            undefined,
            token
        );
        assert.equal(status, 200);
        assert.equal(body.posted, false);
    });

    it("clear DnD → notifications no longer blocked", async () => {
        await req("DELETE", "/api/user/dnd", undefined, token);
        const { body } = await req(
            "POST",
            "/api/notifications/weight-reminder",
            undefined,
            token
        );
        assert.equal(body.posted, true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("Validation errors", () => {
    it("POST /api/auth/register with missing fields → 400", async () => {
        const { status } = await req("POST", "/api/auth/register", { username: "x" });
        assert.equal(status, 400);
    });

    it("POST /api/auth/login with missing fields → 400", async () => {
        const { status } = await req("POST", "/api/auth/login", {});
        assert.equal(status, 400);
    });

    it("POST /api/activity/steps with invalid body → 400", async () => {
        const { status } = await req(
            "POST",
            "/api/activity/steps",
            { totalStepsSinceBoot: "oops" },
            token
        );
        assert.equal(status, 400);
    });

    it("POST /api/weight with negative value → 400", async () => {
        const { status } = await req("POST", "/api/weight", { weightKg: -5 }, token);
        assert.equal(status, 400);
    });

    it("GET /api/user without token → 401", async () => {
        const { status } = await req("GET", "/api/user");
        assert.equal(status, 401);
    });

    it("GET /api/user with garbage token → 401", async () => {
        const { status } = await req("GET", "/api/user", undefined, "garbage.token.here");
        assert.equal(status, 401);
    });

    it("GET unknown route → 404", async () => {
        const { status } = await req("GET", "/api/does-not-exist");
        assert.equal(status, 404);
    });
});
