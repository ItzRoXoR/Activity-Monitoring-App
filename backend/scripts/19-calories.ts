// 19 — Calorie calculator utility endpoints
import { BASE, log } from "./helpers.ts";

// Single exercise
let res = await fetch(`${BASE}/api/calories/exercise?met=8&weightKg=76&durationSeconds=60`);
let data = await res.json();
log("Exercise Calories (MET=8, 76kg, 60s)", data);

// Calories from steps
res = await fetch(`${BASE}/api/calories/steps?steps=8000&weightKg=76&heightCm=180`);
data = await res.json();
log("Calories from 8000 Steps (76kg, 180cm)", data);

// Workout calories (need an existing workout ID)
const workouts = await (await fetch(`${BASE}/api/workouts`)).json();
if (workouts.length > 0) {
    res = await fetch(`${BASE}/api/calories/workout/${workouts[0].id}?weightKg=76`);
    data = await res.json();
    log(`Workout Calories ("${workouts[0].title}", 76kg)`, data);
}
