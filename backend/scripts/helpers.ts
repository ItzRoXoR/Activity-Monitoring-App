/**
 * Test scripts for the Fitness Backend API.
 *
 * Run these scripts individually with:
 *   node scripts/01-health.ts
 *   node scripts/02-register.ts
 *   ... etc.
 *
 * Or run all at once:
 *   node scripts/run-all.ts
 *
 * Each script uses the built-in fetch API (Node 24).
 * The scripts are designed to run in order — later scripts
 * depend on the user/token created by 02-register.ts.
 */

const BASE = process.env.API_URL || "http://localhost:3000";

export { BASE };

// Shared state file for cross-script token passing
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = resolve(__dirname, ".state.json");

export function saveState(data: Record<string, any>) {
    let existing: Record<string, any> = {};
    if (existsSync(STATE_FILE)) {
        existing = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
    }
    writeFileSync(STATE_FILE, JSON.stringify({ ...existing, ...data }, null, 2));
}

export function loadState(): Record<string, any> {
    if (!existsSync(STATE_FILE)) return {};
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
}

export function authHeaders(): Record<string, string> {
    const state = loadState();
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
    };
}

export function log(label: string, data: any) {
    console.log(`\n── ${label} ──`);
    console.log(JSON.stringify(data, null, 2));
}
