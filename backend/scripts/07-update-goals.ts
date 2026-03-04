// 07 — Update daily goals
import { BASE, log, authHeaders } from "./helpers.ts";

const res = await fetch(`${BASE}/api/user/goals`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
        stepsGoal: 12000,
        caloriesGoal: 600,
    }),
});
const data = await res.json();
log("Update Goals (12000 steps, 600 cal)", data);
