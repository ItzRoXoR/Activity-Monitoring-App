// 14 — Start, complete, and abandon workout sessions
import { BASE, log, authHeaders, loadState } from "./helpers.ts";

const state = loadState();
const workoutId = state.workoutId;

// Start a session
let res = await fetch(`${BASE}/api/sessions/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workoutId }),
});
let session = await res.json();
log("Start Workout Session", session);

// Complete the session with burned calories
res = await fetch(`${BASE}/api/sessions/${session.id}/complete`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
        burnedCalories: 120.5,
        finishedAt: new Date().toISOString(),
    }),
});
session = await res.json();
log("Complete Session", session);

// Start another session and abandon it
res = await fetch(`${BASE}/api/sessions/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ workoutId }),
});
const session2 = await res.json();

res = await fetch(`${BASE}/api/sessions/${session2.id}/abandon`, {
    method: "PUT",
    headers: authHeaders(),
});
const abandoned = await res.json();
log("Abandon Session", abandoned);
