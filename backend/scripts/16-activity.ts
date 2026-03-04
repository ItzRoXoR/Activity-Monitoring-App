// 16 — Get today's activity and upload steps
import { BASE, log, authHeaders } from "./helpers.ts";

// Today's activity
let res = await fetch(`${BASE}/api/activity/today`, {
    headers: authHeaders(),
});
let data = await res.json();
log("Today's Activity", data);

// Upload (simulate StepUploadWorker)
res = await fetch(`${BASE}/api/activity/upload`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log("Upload Steps to Backend", data);

// Activity history
res = await fetch(`${BASE}/api/activity/history?period=WEEK`, {
    headers: authHeaders(),
});
data = await res.json();
log(`Activity History (WEEK) — ${data.length} days`, data);
