# Fitness Backend

Backend for the fitness mobile application. Built with TypeScript, Express, Zod, and PostgreSQL.  
Runs directly on **Node.js 24** (no compilation to JavaScript).

## Prerequisites

- Node.js ≥ 22.6 (for native TypeScript + `--watch`)
- PostgreSQL 14+ (or Docker)

## Quick Start

### 1. Start PostgreSQL

Using Docker (easiest):

```bash
docker compose up -d
```

Or point `.env` → `DATABASE_URL` to your existing Postgres instance.

### 2. Install dependencies

```bash
npm install
```

### 3. Run migrations & seed data

```bash
npm run setup
```

This creates all tables and populates the database with 33 exercises and 12 workouts (8 of which are marked as "recommended").

### 4. Start the server

```bash
npm run dev       # with --watch (auto-restart on file changes)
# or
npm start         # without watch
```

Server runs on `http://localhost:3000`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| **Auth** | | | |
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login |
| `GET` | `/api/auth/me` | ✓ | Check auth status |
| **User** | | | |
| `GET` | `/api/user` | ✓ | Get current user profile |
| `PATCH` | `/api/user/profile` | ✓ | Update profile fields |
| `PUT` | `/api/user/goals` | ✓ | Update daily goals |
| `POST` | `/api/user/dnd` | ✓ | Set Do Not Disturb |
| `DELETE` | `/api/user/dnd` | ✓ | Clear Do Not Disturb |
| **Activity** | | | |
| `GET` | `/api/activity/today` | ✓ | Today's activity |
| `GET` | `/api/activity/history?period=WEEK` | ✓ | Activity history |
| `POST` | `/api/activity/steps` | ✓ | Save step count |
| `POST` | `/api/activity/calories` | ✓ | Add burned calories |
| `POST` | `/api/activity/upload` | ✓ | Simulate step upload worker |
| **Weight** | | | |
| `POST` | `/api/weight` | ✓ | Log weight entry |
| `GET` | `/api/weight/history?period=WEEK` | ✓ | Weight history |
| `GET` | `/api/weight/latest` | ✓ | Latest weight entry |
| **Workouts** | | | |
| `GET` | `/api/workouts` | — | All workouts |
| `GET` | `/api/workouts/recommended` | — | Recommended workouts |
| `GET` | `/api/workouts/favorites` | ✓ | User's favorite workouts |
| `GET` | `/api/workouts/favorites/preview` | ✓ | Favorite preview (max 5) |
| `POST` | `/api/workouts/filter` | — | Filter workouts |
| `GET` | `/api/workouts/:id` | — | Single workout details |
| `POST` | `/api/workouts/:id/favorite` | ✓ | Toggle favorite |
| **Sessions** | | | |
| `POST` | `/api/sessions/start` | ✓ | Start workout session |
| `PUT` | `/api/sessions/:id/complete` | ✓ | Complete session |
| `PUT` | `/api/sessions/:id/abandon` | ✓ | Abandon session |
| **Statistics** | | | |
| `GET` | `/api/stats/steps?period=WEEK` | ✓ | Steps chart data |
| `GET` | `/api/stats/calories?period=WEEK` | ✓ | Calories chart data |
| `GET` | `/api/stats/distance?period=WEEK` | ✓ | Distance chart data |
| `GET` | `/api/stats/weight?period=WEEK` | ✓ | Weight chart data |
| `GET` | `/api/stats/bmi` | ✓ | BMI calculation |
| **Notifications** | | | |
| `GET` | `/api/notifications` | ✓ | Unread notifications |
| `PUT` | `/api/notifications/:id/read` | ✓ | Mark notification read |
| `POST` | `/api/notifications/goal-reminder` | ✓ | Trigger goal reminder check |
| `POST` | `/api/notifications/goal-achieved` | ✓ | Post goal achieved notification |
| `POST` | `/api/notifications/weight-reminder` | ✓ | Trigger weight reminder check |
| **Calories (utility)** | | | |
| `GET` | `/api/calories/exercise?met=&weightKg=&durationSeconds=` | — | Calculate exercise calories |
| `GET` | `/api/calories/workout/:id?weightKg=` | — | Calculate workout calories |
| `GET` | `/api/calories/steps?steps=&weightKg=&heightCm=` | — | Calories & distance from steps |

## Test Scripts

The `scripts/` folder contains individual numbered `.ts` files that demonstrate every API endpoint.

```bash
# Run all scripts sequentially (full demo):
node scripts/run-all.ts

# Or run individually:
node scripts/01-health.ts
node scripts/02-register.ts
node scripts/09-all-workouts.ts
# ... etc.
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── schemas.ts             # Zod validation schemas
│   ├── db/
│   │   ├── pool.ts            # PG connection pool + .env loader
│   │   ├── migrate.ts         # Database migrations
│   │   └── seed.ts            # Seed data (exercises, workouts)
│   ├── middleware/
│   │   └── auth.ts            # JWT auth + Zod validation middleware
│   └── routes/
│       ├── auth.ts            # Register, login, me
│       ├── user.ts            # Profile, goals, DnD
│       ├── activity.ts        # Steps, calories, activity history
│       ├── weight.ts          # Weight logging & history
│       ├── workouts.ts        # Workout browsing, filtering, favorites
│       ├── sessions.ts        # Workout session lifecycle
│       ├── stats.ts           # Statistics & BMI
│       ├── notifications.ts   # Notification workers (simulated)
│       └── calories.ts        # Calorie calculator utility
├── scripts/                   # HTTP test scripts
├── docker-compose.yml         # PostgreSQL via Docker
├── .env                       # Environment variables
└── package.json
```
