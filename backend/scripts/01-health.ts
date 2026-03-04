// 01 — Health check
import { BASE, log } from "./helpers.ts";

const res = await fetch(`${BASE}/api/health`);
const data = await res.json();
log("Health Check", data);
