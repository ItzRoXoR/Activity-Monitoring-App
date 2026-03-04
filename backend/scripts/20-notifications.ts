// 20 — Notifications: goal reminder, weight reminder, goal achieved
import { BASE, log, authHeaders } from "./helpers.ts";

// Trigger goal reminder (should post because goals are not yet met)
let res = await fetch(`${BASE}/api/notifications/goal-reminder`, {
    method: "POST",
    headers: authHeaders(),
});
let data = await res.json();
log("Goal Reminder Worker", data);

// Trigger weight reminder
res = await fetch(`${BASE}/api/notifications/weight-reminder`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log("Weight Reminder Worker", data);

// Post goal achieved
res = await fetch(`${BASE}/api/notifications/goal-achieved`, {
    method: "POST",
    headers: authHeaders(),
});
data = await res.json();
log("Goal Achieved Notification", data);

// Get all pending notifications
res = await fetch(`${BASE}/api/notifications`, {
    headers: authHeaders(),
});
data = await res.json();
log(`Pending Notifications (${data.length})`, data);

// Mark the first one as read
if (data.length > 0) {
    res = await fetch(`${BASE}/api/notifications/${data[0].id}/read`, {
        method: "PUT",
        headers: authHeaders(),
    });
    const readResult = await res.json();
    log("Mark Notification Read", readResult);

    // Verify it's gone from pending
    res = await fetch(`${BASE}/api/notifications`, {
        headers: authHeaders(),
    });
    data = await res.json();
    log(`Pending After Read (${data.length})`, data.map((n: any) => n.message));
}
