# Course Schedule Manager

![CI](https://github.com/yyx-3590/course-schedule-manager/actions/workflows/ci.yml/badge.svg)

**Live demo: https://course-schedule-1p92.onrender.com**

The demo runs on a free plan. If nobody used it for a while, the first visit can take up to a minute while the server wakes up. The page shows a notice while it waits.

A full stack web app for planning your classes. Sign up, add your courses for each term, and see them on a weekly timetable you can print or save as a PDF.

This project merges two of my earlier projects: a Contact Management Backend API (Node, Express, MongoDB, JWT) and a Class Schedule Manager (plain JavaScript front end). I rebuilt the front end in React and added tests, Docker, and CI/CD.

## Features

- Sign up, log in, and reset a forgotten password
- Add, edit, and delete courses. Each course can have several time slots
- Pick a term (Fall, Winter, Spring, Summer) and a year, and filter courses by term
- Weekly timetable with color themes, choose which details to show, print or save as PDF
- Overlapping class times are blocked, both inside one course and across courses in the same term
- Every user only sees their own courses

## Tech stack

| Part | Tools |
| --- | --- |
| Front end | React, Vite, React Router |
| Back end | Node.js, Express 5, MongoDB with Mongoose |
| Security | JWT, bcrypt, zod validation, helmet, rate limiting |
| Testing | Jest, Supertest, mongodb-memory-server |
| DevOps | Docker, Docker Compose, nginx, GitHub Actions, GitHub Container Registry |
| Hosting | Render (API and static site), MongoDB Atlas |

## Run with Docker

You only need Docker.

```bash
cp .env.docker.example .env
# open .env and set ACCESS_TOKEN_SECRET (you can make one with: openssl rand -hex 32)
docker compose up --build
```

Open http://localhost:8080.

Email is not set up, so a password reset link is printed in the server logs. Run `docker compose logs server` to find it.

## Run for development

You need Node 22 and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
# back end
cd server
cp ../.env.example .env      # then fill in CONNECTION_STRING and ACCESS_TOKEN_SECRET
npm install
npm run dev                  # http://localhost:5001

# front end, in a second terminal
cd client
npm install
npm run dev                  # http://localhost:5173
```

The API runs on port 5001 because port 5000 is used by AirPlay on macOS. The Vite dev server sends `/api` requests to it.

## Tests

```bash
cd server
npm test
```

The tests start their own in memory MongoDB, so no database setup is needed. They cover sign up and login, course CRUD, data isolation between users, time conflict rules, and the password reset flow.

## API

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/users/register` | Create an account |
| POST | `/api/users/login` | Log in and get a JWT |
| GET | `/api/users/current` | Current user |
| POST | `/api/users/forgot-password` | Send a reset link |
| POST | `/api/users/reset-password` | Set a new password with a reset token |
| GET, POST, DELETE | `/api/courses` | List courses, create a course, delete several courses |
| GET, PUT, DELETE | `/api/courses/:id` | Read, update, or delete one course |
| GET | `/api/health` | Health check |

Course routes need the header `Authorization: Bearer <token>`.

## CI/CD

`.github/workflows/ci.yml` runs on every push and pull request:

1. **Server**: lint and run all tests with coverage
2. **Client**: build the front end
3. **Docker**: start the whole stack with Docker Compose, check the page and the API through nginx, then register and log in
4. **Publish**: on pushes to `main`, build the images and push them to GitHub Container Registry

Render is set to deploy only after these checks pass, so a failing commit never goes live.

## Deployment

The live demo uses three free services:

- **MongoDB Atlas** for the database
- **Render web service** for the API. It builds `server/Dockerfile` and uses `/api/health` as the health check
- **Render static site** for the React app

The React app calls the API directly, so the API allows only the front end's address through CORS.

API settings: `CONNECTION_STRING`, `ACCESS_TOKEN_SECRET`, `JWT_EXPIRES_IN`, `TRUST_PROXY=1`, and `CLIENT_URL` (the address of the static site).

Static site settings: `VITE_API_URL` (the address of the API) and a rewrite rule from `/*` to `/index.html` for React Router.

Without email set up, password reset links appear in the API logs.

## Security notes

- Passwords are hashed with bcrypt and never returned by the API
- Reset tokens are random, expire after 30 minutes, work once, and only their hash is stored
- Forgot password gives the same answer whether or not the email exists
- All request bodies are validated with zod
- Login and reset routes are rate limited
- The API accepts browser requests only from the configured front end address (CORS)

## Project layout

```
client/          React app, nginx config, Dockerfile
server/          Express API, tests, Dockerfile
docker-compose.yml
.github/workflows/ci.yml
```
