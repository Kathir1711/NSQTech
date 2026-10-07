# Ledgerkey

A single-page access-management app built with **Angular 12** and a **Node.js + TypeScript (Express)** API. Users sign in with a User ID, password and role. They see which records their access level can open, and admins can manage the users in the database. A latency slider adds a delay to every API call so the app's async handling is easy to see.

## Screenshots

| Sign in (General User) | Dashboard (General User) |
|---|---|
| ![Login as General User](docs/screenshots/01-login-general-user.png) | ![General User dashboard with locked records](docs/screenshots/02-dashboard-general-user.png) |

| Sign in (Admin) | Dashboard (Admin) |
|---|---|
| ![Login as Admin](docs/screenshots/03-login-admin.png) | ![Admin dashboard with all records open](docs/screenshots/04-dashboard-admin.png) |

**Manage users (Admin only)**

![Manage users](docs/screenshots/05-manage-users.png)

## Features

- **Role-based login:** User ID, password and role (`General User` or `Admin`). The API validates all three and issues a JWT.
- **Personal dashboard:** profile details plus a records table. Records above the user's access level are hatched, masked and labelled "Needs Admin". The masking happens on the server, so restricted titles and owners never reach the browser.
- **User management (Admin):** add users, change roles, enable or disable accounts, and delete users. Admins can't demote, disable or delete themselves.
- **Async demo:** the header slider sets an API delay of 0 to 5 seconds, sent as `?delay=<ms>`. The UI shows it with a top progress bar, loading placeholders per section, per-request load times and per-row busy states.
- **Modular Angular code:** lazy-loaded feature modules, route guards, an HTTP interceptor and an `APP_INITIALIZER` that restores the session on app load.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 12, RxJS, Angular Router (lazy modules, guards), Reactive Forms, HttpClient interceptors, SCSS |
| Backend | Node.js, Express, TypeScript, JSON Web Tokens |
| Storage | Local JSON file (`server/db.json`), created and seeded on first start |
| Security | scrypt password hashing, JWT bearer auth, server-side role checks |

## Getting started

**Prerequisites:** Node.js 14 or 16 (recommended for Angular 12) and npm.

```bash
# 1. API (http://localhost:3000)
cd server
npm install
npm run dev

# 2. Web app (http://localhost:4200, proxies /api to the API)
cd client
npm install
npm start
```

### Demo accounts

| User ID | Password | Role | Notes |
|---|---|---|---|
| `admin` | `Admin@123` | Admin | Sees all records, can manage users |
| `alice` | `User@123` | General User | Sees open records only |
| `bob` | `User@123` | General User | Disabled account, sign-in is rejected |

## Project structure

```
ledgerkey/
├── server/
│   └── src/index.ts            # Express API, JWT auth, role checks, delay middleware, JSON store
├── client/
│   ├── proxy.conf.json         # /api -> http://localhost:3000
│   └── src/app/
│       ├── app.module.ts       # Root module, lazy routes, interceptor, APP_INITIALIZER
│       ├── app.component.ts    # Shell: nav, latency slider, progress bar
│       ├── core/
│       │   ├── auth.service.ts       # Session state (BehaviorSubject), login/logout/restore
│       │   ├── data.service.ts       # UserService and RecordsService
│       │   ├── api.interceptor.ts    # Adds token and ?delay, counts in-flight requests
│       │   ├── latency.service.ts    # Latency setting and pending-request counter
│       │   ├── guards.ts             # AuthGuard, AdminGuard (canActivate / canLoad)
│       │   └── models.ts             # Types and the track() async-state helper
│       └── features/
│           ├── auth/           # Login (lazy)
│           ├── dashboard/      # Profile and records (lazy)
│           └── admin/          # User management (lazy, admin only)
└── docs/screenshots/
```

## API reference

All endpoints accept an optional `?delay=<ms>` query parameter (capped at 10000) to simulate latency.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Body: `{ userId, password, role }`. Returns `{ token, user }` |
| GET | `/api/me` | Signed in | Current user profile |
| GET | `/api/records` | Signed in | Records with a `granted` flag for the caller's role. Restricted rows are masked |
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create a user |
| PUT | `/api/users/:id` | Admin | Update name, email, role, active status or password |
| DELETE | `/api/users/:id` | Admin | Delete a user |

## How the async handling works

1. `LatencyService` stores the slider value and a count of in-flight requests.
2. `ApiInterceptor` attaches the JWT and `?delay=` to each `/api` call and updates the counter.
3. The shell's progress bar listens to the counter.
4. `track()` in `core/models.ts` wraps a request into `{ loading, data, error, ms }`. The profile card and records table load in parallel and each shows its own placeholder, so one slow call doesn't block the other.
5. In the admin table, each row has its own busy state, so other rows stay usable while one update is in flight.

## Moving to a cloud database

All persistence goes through two functions in `server/src/index.ts`, `load()` and `save()`. To use **MongoDB** or **AWS DynamoDB**, replace them with repository methods such as `findUser`, `listUsers`, `upsertUser` and `listRecords`. The routes, guards and Angular code don't change. Set `JWT_SECRET` in the environment for any non-local deployment.

## Scripts

| Location | Command | Purpose |
|---|---|---|
| `server` | `npm run dev` | Start the API with auto-reload |
| `server` | `npm run build && npm start` | Compile and run the API |
| `client` | `npm start` | Dev server on port 4200 |
| `client` | `npm run build` | Production build into `dist/ledgerkey` |

## License

MIT
