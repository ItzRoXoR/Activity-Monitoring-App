# Fitness Backend

REST API for the fitness mobile application. Built with NestJS + TypeScript + PostgreSQL.

## Prerequisites

- Node.js >= 18
- PostgreSQL 14+ (or Docker)

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

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
| **Calories (utility)** | | | |
| `GET` | `/api/calories/exercise?met=&weightKg=&durationSeconds=` | — | Calculate exercise calories |
| `GET` | `/api/calories/workout/:id?weightKg=` | — | Calculate workout calories |
| `GET` | `/api/calories/steps?steps=&weightKg=&heightCm=` | — | Calories & distance from steps |

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed structure and how modules connect.
