// 08 — Set and clear Do Not Disturb
import { BASE, log, authHeaders } from "./helpers.ts";

// Set DnD for one day
let res = await fetch(`${BASE}/api/user/dnd`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ duration: "ONE_DAY" }),
});
let data = await res.json();
log("Set DnD (ONE_DAY)", data);

// Clear DnD
res = await fetch(`${BASE}/api/user/dnd`, {
    method: "DELETE",
    headers: authHeaders(),
});
data = await res.json();
log("Clear DnD", data);
