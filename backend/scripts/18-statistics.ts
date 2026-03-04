// 18 — Statistics
import { BASE, log, authHeaders } from "./helpers.ts";

// Steps stats
let res = await fetch(`${BASE}/api/stats/steps?period=WEEK`, {
    headers: authHeaders(),
});
let data = await res.json();
log("Steps Stats (WEEK)", data);

// Calories stats
res = await fetch(`${BASE}/api/stats/calories?period=WEEK`, {
    headers: authHeaders(),
});
data = await res.json();
log("Calories Stats (WEEK)", data);

// Distance stats
res = await fetch(`${BASE}/api/stats/distance?period=WEEK`, {
    headers: authHeaders(),
});
data = await res.json();
log("Distance Stats (WEEK)", data);

// Weight stats
res = await fetch(`${BASE}/api/stats/weight?period=WEEK`, {
    headers: authHeaders(),
});
data = await res.json();
log("Weight Stats (WEEK)", data);

// BMI
res = await fetch(`${BASE}/api/stats/bmi`, {
    headers: authHeaders(),
});
data = await res.json();
log("BMI Calculation", data);
