## MERN Student Management System

A student management web app built with MongoDB, Express.js, React, and Node.js.

## Prerequisites

- Node.js (LTS version)
- npm (comes with Node.js)
- Git

## Project Structure

```
mern-practice/
  client/   React frontend (Vite)
  server/   Express backend
  README.md
```

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd mern-practice
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev
```

The API runs at http://localhost:5000

### 3. Start the frontend (in a second terminal)

```bash
cd client
npm install
npm run dev
```

The app runs at http://localhost:5173

## Verify

- Open http://localhost:5000. You should see `{"message":"API is running"}`.
 - Open http://localhost:5173. You should see the Student Management home page.
## Database Setup (MongoDB Atlas)

1. Create a free M0 cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user. Use letters and numbers only in the password.
3. In **Network Access**, add your current IP address.
4. Copy `server/.env.example` to `server/.env` and fill in your own values:

```
PORT=5000
DB_USER=your_atlas_username
DB_PASS=your_atlas_password
DB_HOST=cluster0.xxxxx.mongodb.net
DB_NAME=student_management
```

5. Start the server:

```bash
cd server
npm run dev

## Authentication

### Strategy
JWT access token + refresh token.

- **Access token**: 15 minutes, kept in React memory only (not localStorage), sent as `Authorization: Bearer`.
- **Refresh token**: 7 days, stored in an `httpOnly`, `sameSite=strict` cookie limited to `/api/auth`. JavaScript cannot read it.
- On a 401, the API client calls `/api/auth/refresh` once and retries the request.
- On page reload, the app restores the session from the refresh cookie.
- **Logout** and **password change/reset** increase the user's `tokenVersion`, so every existing token stops working immediately.

### Security measures
- Passwords hashed with bcrypt (cost 12); never stored or returned in plain text.
- Login returns the same message for unknown email and wrong password, and runs bcrypt in both cases to avoid timing differences.
- Password reset tokens are random 32-byte values; only their SHA-256 hash is stored, they expire after 15 minutes and work once.
- Forgot-password returns the same response whether or not the email exists.
- Rate limiting on login, register, forgot and reset.
- Users cannot set or change their `role`.
- Secrets live only in `server/.env`; the frontend has no secrets.

### Environment variables (server/.env)
| Variable | Purpose |
|---|---|
| JWT_ACCESS_SECRET | Signs access tokens (long random string) |
| JWT_REFRESH_SECRET | Signs refresh tokens (different long random string) |
| ACCESS_TOKEN_TTL | Access token lifetime, e.g. `15m` |
| REFRESH_TOKEN_TTL | Refresh token lifetime, e.g. `7d` |
| CLIENT_URL | Frontend origin for CORS and reset links |

Generate a secret:
`node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Password reset in development
Until email is added (Task 14), the reset link is printed in the server terminal. This happens only when `NODE_ENV` is not `production`.

### Pages
| Path | Access |
|---|---|
| /login, /signup | Logged-out users only |
| /forgot-password, /reset-password/:token | Anyone |
| /students, /students/:id, /students/:id/edit, /register, /profile | Logged-in users only |

