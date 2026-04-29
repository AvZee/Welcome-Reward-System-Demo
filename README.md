# Welcome Reward System Demo

A full-stack app simulating an onboarding reward system that demonstrates delayed job processing with real-time status polling, event tracking, and idempotent worker logic.

## Tech Stack

- React - Vite
- Bun - Runtime
- Hono - API
- Drizzle ORM
- PostgreSQL - Database
- pg-boss - Background Jobs
- Zod - Validation
- Pino - Logging

## Live Demo

- Frontend: https://welcome-reward-system-demo.vercel.app
- Backend API: https://welcome-reward-system-demo.onrender.com

## Features

- Simulate completing onboarding for demo users
- Delayed reward notification jobs are queued with pg-boss
- User state is validated before a reward notification is sent
- Duplicate reward notifications are prevented through validation in the job handler
- Notifications and reward events are stored in the PostgreSQL database
- Monitor the reward status, countdown, event timeline, and notifications of the selected user in the UI
- Reset demo users for repeatable testing

## Background Job Flow

1. User clicks **Complete Onboarding** button
2. Frontend sends a `POST /api/onboarding/complete` request to the backend through the API
3. Backend validates the request with Zod
4. Backend updates onboarding state using Drizzle
5. Backend enqueues a delayed pg-boss job
6. Worker picks up the job after the delay
7. Worker validates the user state
8. Worker inserts a welcome reward notification
9. Frontend polling updates the UI

## Local Setup

### 1. Clone Repository

```
git clone https://github.com/AvZee/Welcome-Reward-System-Demo.git
cd Welcome-Reward-System-Demo
```

### 2. Install Backend Dependencies

```
cd server
bun install
```

### 3. Configure Backend Environment

Create ```server/.env```:

```
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
WELCOME_REWARD_DELAY=5 minutes
```
Notes:
- ```.env.example``` files are provided for reference in both the ```server```  and ```client``` directories.
- ```WELCOME_REWARD_DELAY``` also supports delays measured in "seconds".

### 4. Push Database Schema

```
bun run db:push
```

### 5. Seed Demo Users

```
bun run db:seed
```

### 6. Run Backend

```
bun run dev
```

### 7. Install Frontend Dependencies

```
cd ../client
bun install
```

### 8. Configure Frontend Environment

Create ```client/.env```

```
VITE_API_URL=http://localhost:3000
```

### 9. Run Frontend

```
bun run dev
```

## API Endpoints

### Onboarding

```
POST /api/onboarding/complete
```
Completes onboarding for a user and schedules a delayed welcome reward job.

### Notifications

```
GET /api/notifications/:userId
```
Returns reward notifcations for a user.

### Demo

```
GET /api/demo/users
POST /api/demo/reset/:userId
```
Returns demo users and resets a selected user's demo state.

## Note

The reward job worker is designed to be idempotent, so duplicate job execution does not create duplicate reward notifications.