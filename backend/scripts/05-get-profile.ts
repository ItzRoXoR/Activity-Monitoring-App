// 05 — Get current user profile
import { BASE, log, authHeaders } from "./helpers.ts";

const res = await fetch(`${BASE}/api/user`, {
    headers: authHeaders(),
});
const data = await res.json();
log("Get User Profile", data);
