// 21 — DnD blocks notifications
import { BASE, log, authHeaders } from "./helpers.ts";

// Enable DnD permanently
let res = await fetch(`${BASE}/api/user/dnd`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ duration: "PERMANENTLY" }),
});
let data = await res.json();
log("Enable DnD PERMANENTLY", { dndPermanently: data.doNotDisturbPermanently });

// Now goal-reminder should be blocked
res = await fetch(`${BASE}/api/notifications/goal-reminder`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log("Goal Reminder with DnD ON", data);

// Weight reminder also blocked
res = await fetch(`${BASE}/api/notifications/weight-reminder`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log("Weight Reminder with DnD ON", data);

// Clear DnD
res = await fetch(`${BASE}/api/user/dnd`, {
    method: "DELETE",
    headers: authHeaders(),
});
data = await res.json();
log("Clear DnD", { dndPermanently: data.doNotDisturbPermanently, dndUntil: data.doNotDisturbUntil });
