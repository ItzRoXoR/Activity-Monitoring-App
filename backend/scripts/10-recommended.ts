// 10 — Get recommended workouts
import { BASE, log } from "./helpers.ts";

const res = await fetch(`${BASE}/api/workouts/recommended`);
const data = await res.json();
log(`Recommended Workouts (${data.length})`, data.map((w: any) => ({
    title: w.title,
    type: w.type,
    difficulty: w.difficulty,
})));
