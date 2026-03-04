// 09 — Browse all workouts
import { BASE, log } from "./helpers.ts";

const res = await fetch(`${BASE}/api/workouts`);
const data = await res.json();
log(`All Workouts (${data.length} total)`, data.map((w: any) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    difficulty: w.difficulty,
    durationMinutes: w.durationMinutes,
    exerciseCount: w.exercises.length,
})));
