// 02 — Register a new user
import { BASE, log, saveState } from "./helpers.ts";

const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        name: "Alexander",
        username: "alex2026",
        password: "pass1234",
        gender: "MALE",
        dateOfBirth: "2000-05-15",
        weightKg: 78,
        heightCm: 180,
        dailyStepsGoal: 10000,
        dailyCaloriesGoal: 500,
    }),
});

const data = await res.json();
log("Register User", data);

if (data.token) {
    saveState({ token: data.token, userId: data.user?.id });
    console.log("\n✓ Token saved for subsequent scripts.");
}
