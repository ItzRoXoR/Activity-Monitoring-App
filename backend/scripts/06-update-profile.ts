// 06 — Update user profile (change weight)
import { BASE, log, authHeaders } from "./helpers.ts";

const res = await fetch(`${BASE}/api/user/profile`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({
        weightKg: 76.5,
    }),
});
const data = await res.json();
log("Update Profile (weight → 76.5)", data);
