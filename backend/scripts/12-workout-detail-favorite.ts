// 12 — Get a single workout and toggle favorite
import { BASE, log, authHeaders, saveState, loadState } from "./helpers.ts";

// Get all workouts first to pick one
const all = await fetch(`${BASE}/api/workouts`);
const workouts = await all.json();
const workout = workouts[0];

saveState({ workoutId: workout.id });
log("Single Workout Details", workout);

// Toggle favorite ON
let res = await fetch(`${BASE}/api/workouts/${workout.id}/favorite`, {
    method: "POST",
    headers: authHeaders(),
});
let data = await res.json();
log(`Toggle Favorite ON for "${workout.title}"`, data);

// Toggle favorite OFF
res = await fetch(`${BASE}/api/workouts/${workout.id}/favorite`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log(`Toggle Favorite OFF for "${workout.title}"`, data);

// Toggle it ON again for later scripts
await fetch(`${BASE}/api/workouts/${workout.id}/favorite`, {
    method: "POST",
    headers: authHeaders(),
});

// Also favorite a second workout
if (workouts.length > 1) {
    await fetch(`${BASE}/api/workouts/${workouts[1].id}/favorite`, {
        method: "POST",
        headers: authHeaders(),
    });
}

console.log("\n✓ Two workouts favorited for later scripts.");
