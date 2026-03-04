// 13 — Get favorite workouts lists
import { BASE, log, authHeaders } from "./helpers.ts";

// Preview (max 5)
let res = await fetch(`${BASE}/api/workouts/favorites/preview`, {
    headers: authHeaders(),
});
let data = await res.json();
log(`Favorites Preview (${data.length})`, data.map((w: any) => w.title));

// All favorites
res = await fetch(`${BASE}/api/workouts/favorites`, {
    headers: authHeaders(),
});
data = await res.json();
log(`All Favorites (${data.length})`, data.map((w: any) => w.title));
