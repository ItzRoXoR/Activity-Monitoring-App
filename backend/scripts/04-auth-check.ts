// 04 — Check auth status
import { BASE, log, authHeaders } from "./helpers.ts";

const res = await fetch(`${BASE}/api/auth/me`, {
    headers: authHeaders(),
});
const data = await res.json();
log("Auth Check (me)", data);
