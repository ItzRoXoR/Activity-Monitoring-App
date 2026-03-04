/**
 * Run all test scripts sequentially.
 * Usage: node scripts/run-all.ts
 */
import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { unlinkSync, existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const stateFile = resolve(__dirname, ".state.json");

// Clean state from previous runs
if (existsSync(stateFile)) unlinkSync(stateFile);

const scripts = readdirSync(__dirname)
    .filter((f) => /^\d{2}-/.test(f) && f.endsWith(".ts"))
    .sort();

console.log(`\n${"═".repeat(60)}`);
console.log("  FITNESS BACKEND — FULL API TEST SUITE");
console.log(`${"═".repeat(60)}\n`);
console.log(`Found ${scripts.length} test scripts.\n`);

for (const script of scripts) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`▶ Running: ${script}`);
    console.log(`${"─".repeat(60)}`);
    try {
        execSync(`node ${resolve(__dirname, script)}`, {
            stdio: "inherit",
            cwd: resolve(__dirname, ".."),
        });
    } catch (err) {
        console.error(`✗ Script ${script} failed!`);
        process.exit(1);
    }
}

console.log(`\n${"═".repeat(60)}`);
console.log("  ALL TESTS PASSED ✓");
console.log(`${"═".repeat(60)}\n`);
