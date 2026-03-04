// 03 — Login with the registered user
import { BASE, log, saveState } from "./helpers.ts";

const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        username: "alex2026",
        password: "pass1234",
    }),
});

const data = await res.json();
log("Login", data);

if (data.token) {
    saveState({ token: data.token, userId: data.user?.id });
    console.log("\n✓ Token refreshed.");
}
