// 11 — Filter workouts (HIIT + HARD difficulty)
import { BASE, log } from "./helpers.ts";

const res = await fetch(`${BASE}/api/workouts/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        types: ["HIIT"],
        difficulties: ["HARD"],
    }),
});
const data = await res.json();
log("Filtered Workouts (HIIT + HARD)", data.map((w: any) => ({
    title: w.title,
    type: w.type,
    difficulty: w.difficulty,
})));

// Also filter by STRENGTH + LEGS muscle group
const res2 = await fetch(`${BASE}/api/workouts/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        types: ["STRENGTH"],
        muscleGroups: ["LEGS"],
    }),
});
const data2 = await res2.json();
log("Filtered Workouts (STRENGTH + LEGS)", data2.map((w: any) => ({
    title: w.title,
    type: w.type,
})));
