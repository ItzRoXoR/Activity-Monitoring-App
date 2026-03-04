// 17 — Log weight entries
import { BASE, log, authHeaders } from "./helpers.ts";

// Log today's weight
let res = await fetch(`${BASE}/api/weight`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ weightKg: 76.2 }),
});
let data = await res.json();
log("Log Weight (76.2 kg)", data);

// Log yesterday's weight for history
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
res = await fetch(`${BASE}/api/weight`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ weightKg: 76.8, date: yesterday }),
});
data = await res.json();
log(`Log Weight yesterday (${yesterday}: 76.8 kg)`, data);

// Get latest
res = await fetch(`${BASE}/api/weight/latest`, {
    headers: authHeaders(),
});
data = await res.json();
log("Latest Weight Entry", data);

// Get history
res = await fetch(`${BASE}/api/weight/history?period=WEEK`, {
    headers: authHeaders(),
});
data = await res.json();
log(`Weight History (WEEK) — ${data.length} entries`, data);
