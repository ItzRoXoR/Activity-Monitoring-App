import pool from "./pool.ts";

const migrations: { name: string; sql: string }[] = [
    {
        name: "001_initial_schema",
        sql: `
      -- USERS
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
        date_of_birth DATE NOT NULL,
        weight_kg REAL NOT NULL,
        height_cm REAL NOT NULL,
        daily_steps_goal INT NOT NULL DEFAULT 10000,
        daily_calories_goal INT NOT NULL DEFAULT 500,
        do_not_disturb_until TIMESTAMPTZ,
        do_not_disturb_permanently BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- EXERCISES
      CREATE TABLE IF NOT EXISTS exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        met DOUBLE PRECISION NOT NULL,
        duration_seconds INT NOT NULL,
        rest_after_seconds INT DEFAULT 0,
        image_res_id INT
      );

      -- WORKOUTS
      CREATE TABLE IF NOT EXISTS workouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        duration_minutes INT NOT NULL,
        is_recommended BOOLEAN DEFAULT FALSE
      );

      -- WORKOUT <-> EXERCISE junction
      CREATE TABLE IF NOT EXISTS workout_exercises (
        workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (workout_id, exercise_id)
      );

      -- USER FAVORITE WORKOUTS
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, workout_id)
      );

      -- DAILY ACTIVITY
      CREATE TABLE IF NOT EXISTS daily_activities (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        steps INT DEFAULT 0,
        burned_calories DOUBLE PRECISION DEFAULT 0,
        distance_km DOUBLE PRECISION DEFAULT 0,
        UNIQUE (user_id, date)
      );

      -- WEIGHT ENTRIES
      CREATE TABLE IF NOT EXISTS weight_entries (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        weight_kg REAL NOT NULL,
        UNIQUE (user_id, date)
      );

      -- WORKOUT SESSIONS
      CREATE TABLE IF NOT EXISTS workout_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ,
        burned_calories DOUBLE PRECISION DEFAULT 0,
        completed_early BOOLEAN DEFAULT FALSE
      );

      -- NOTIFICATIONS
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE
      );
    `,
    },
];

async function migrate() {
    const client = await pool.connect();
    try {
        // Ensure fitness_migrations table exists (use distinct name to avoid conflicts)
        await client.query(`
      CREATE TABLE IF NOT EXISTS fitness_migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        for (const m of migrations) {
            const exists = await client.query(
                "SELECT 1 FROM fitness_migrations WHERE name = $1",
                [m.name]
            );
            if (exists.rowCount && exists.rowCount > 0) {
                console.log(`  ✓ ${m.name} (already applied)`);
                continue;
            }
            await client.query(m.sql);
            await client.query("INSERT INTO fitness_migrations (name) VALUES ($1)", [
                m.name,
            ]);
            console.log(`  ✓ ${m.name} (applied)`);
        }
        console.log("Migrations complete.");
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
