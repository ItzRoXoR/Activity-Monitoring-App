import pg from "pg";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getEnv(key: string, fallback?: string): string {
    const val = process.env[key] ?? fallback;
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
}

// Load .env manually (no dotenv dependency)
try {
    const envPath = resolve(__dirname, "../../.env");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
} catch {
    // .env not found — rely on real env vars
}

const pool = new pg.Pool({
    connectionString: getEnv(
        "DATABASE_URL",
        "postgresql://fitness:fitness@localhost:5432/fitness_db"
    ),
});

export default pool;
export { getEnv };
