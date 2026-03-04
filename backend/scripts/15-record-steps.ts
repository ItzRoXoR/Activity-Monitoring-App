// 15 — Record steps (simulating StepCounterService upload)
import { BASE, log, authHeaders } from "./helpers.ts";

const res = await fetch(`${BASE}/api/activity/steps`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
        totalStepsSinceBoot: 4523,
        timestamp: new Date().toISOString(),
    }),
});
const data = await res.json();
log("Save Steps (4523)", data);

// Add more steps later in the day
const res2 = await fetch(`${BASE}/api/activity/steps`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
        totalStepsSinceBoot: 8210,
        timestamp: new Date().toISOString(),
    }),
});
const data2 = await res2.json();
log("Update Steps (8210)", data2);
