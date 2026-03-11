# backend architecture

## what it is

a rest api for a fitness tracking app built with nest.js + typescript + postgresql.
handles user accounts, workout catalog, exercise sessions, daily activity tracking (steps, calories, distance), and weight logging.

## how it's structured

```
src/
  main.ts                  -- bootstrap, global prefix /api, validation pipe
  app.module.ts            -- wires all feature modules together
  health.controller.ts     -- GET /api/health liveness check
  database/
    database.module.ts     -- global module so every service can inject the pool
    database.service.ts    -- thin wrapper around pg.Pool, single query() method
    migrate.ts             -- standalone script, idempotent schema creation
    seed.ts                -- standalone script, populates exercises + workouts
  auth/
    auth.module.ts
    auth.controller.ts     -- POST register, POST login, GET me
    auth.service.ts        -- password hashing (bcrypt), jwt signing, user formatting
    auth.guard.ts          -- CanActivate guard, verifies bearer token
    auth.dto.ts            -- LoginDto, RegisterDto with class-validator decorators
  user/
    user.module.ts
    user.controller.ts     -- GET profile, PATCH profile, PUT goals, POST/DELETE dnd
    user.service.ts        -- dynamic update builder, dnd interval mapping
    user.dto.ts            -- UpdateProfileDto, UpdateGoalsDto, SetDndDto
  activity/
    activity.module.ts
    activity.controller.ts -- GET today, GET history, POST steps, POST calories, POST upload
    activity.service.ts    -- step saving with distance/calorie calc, calorie accumulation
    activity.dto.ts        -- SaveStepsDto, AddCaloriesDto
  weight/
    weight.module.ts
    weight.controller.ts   -- POST log, GET history, GET latest
    weight.service.ts      -- upsert weight entry, also updates user.weight_kg
    weight.dto.ts          -- LogWeightDto
  workouts/
    workouts.module.ts
    workouts.controller.ts -- GET all, GET recommended, GET favorites, POST filter, GET :id, POST :id/favorite
    workouts.service.ts    -- exercise hydration, dynamic filter builder, favorite toggle
    workouts.dto.ts        -- WorkoutFilterDto
  sessions/
    sessions.module.ts
    sessions.controller.ts -- POST start, PUT :id/complete, PUT :id/abandon
    sessions.service.ts    -- session lifecycle, burn calories on completion
    sessions.dto.ts        -- StartSessionDto, CompleteSessionDto
  calories/
    calories.module.ts
    calories.controller.ts -- GET exercise, GET workout/:id, GET steps
    calories.service.ts    -- pure math: met formula, step calorie/distance estimation
    calories.dto.ts        -- (empty, query params only)
```

## how things connect

1. `app.module` imports all feature modules. `DatabaseModule` is `@Global()` so its `DatabaseService` is injectable everywhere without explicit imports.

2. every controller that needs auth uses `@UseGuards(AuthGuard)`. the guard pulls the bearer token from the authorization header, verifies it with jsonwebtoken, and sets `request.userId`.

3. nest's `ValidationPipe` with `whitelist: true` handles dto validation automatically — any request body that doesn't match the dto decorators gets a 400 with specific field errors.

4. nest's built-in exception filters turn `NotFoundException`, `ConflictException`, etc. into proper http responses, so services don't need try/catch for http errors.

## database

postgresql via `pg` driver (no orm). connection string from `DATABASE_URL` env var, defaults to the local docker-compose instance on port 5435.

tables: `users`, `exercises`, `workouts`, `workout_exercises`, `user_favorites`, `daily_activities`, `weight_entries`, `workout_sessions`.

## running it

```
docker-compose up -d          # start postgres
npm install
npm run migrate               # create tables
npm run seed                  # populate exercise/workout catalog
npm run dev                   # start with --watch
```
