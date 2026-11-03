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


## Roles and permissions

| Feature | Admin | Staff | Viewer |
|---|---|---|---|
| View, search and filter students | ✅ | ✅ | ✅ (no mobile or address) |
| Add students | ✅ | ✅ | ❌ |
| Edit students | ✅ | ✅ except email | ❌ |
| Delete students | ✅ | ❌ | ❌ |
| Manage users and roles | ✅ | ❌ | ❌ |

### How it works
- **Server (enforced):** `config/permissions.js` defines the rules. The `authorize(permission)` middleware returns 403 for any role without that permission. Viewers' student queries exclude mobile and address. Staff updates that include `email` are rejected.
- **Client (convenience):** `utils/permissions.js` mirrors the rules to hide buttons, columns and links. Routes such as `/register` and `/users` show "Access denied" for roles without permission. The server rejects the request anyway.
- **Role changes** happen only through the admin Users page or the `set-role` script. Users cannot change their own role; `PATCH /api/auth/me` rejects a `role` field.
- **Self-protection:** admins cannot change their own role or delete themselves, and the last admin cannot be removed.
- A role change signs the user out, so the new role applies immediately.

### First admin
```
cd server
npm run set-role -- your@email.com admin
```
## Courses and instructors

### Data model
```
Instructor ──< Course ──< Student
```
- `Student.course` references a `Course` by ID (required).
- `Course.instructor` references an `Instructor` by ID (optional).
- Course and instructor names are shown with Mongoose `populate`, so renaming a course updates every student automatically.
- Student counts per course use one MongoDB aggregation (`$group`) for the whole page, not one query per course.

### Deletion rules
| Delete | Behaviour | Why |
|---|---|---|
| Course with students | Blocked (409); set it to inactive instead | Students would point to a course that no longer exists |
| Course without students | Allowed | Nothing depends on it |
| Instructor | Allowed; their courses become unassigned | Courses and students stay valid |

### Inactive courses
Inactive courses stay visible but cannot be chosen for new or moved enrolments. Existing students keep them.

### Permissions
| | Admin | Staff | Viewer |
|---|---|---|---|
| View courses and enrolled students | ✅ | ✅ | ✅ |
| View instructors | ✅ | ✅ | ❌ |
| Create, edit, delete courses and instructors | ✅ | ❌ | ❌ |

### Migrating existing data
Earlier versions stored the course as text. To convert existing students to course references, run this once from `server`:
```
npm run migrate-courses
```
It creates a Course for each text value and links the students. It is safe to run again.
## File uploads

### Storage
- Files are stored on disk in `server/uploads/` (`photos/` and `documents/`), outside any public folder, and ignored by git.
- Set a different location with `UPLOAD_DIR` in `server/.env`.
- MongoDB stores only metadata: storage key, type, size, original name, uploader.
- All disk access is in `server/services/fileStorage.js`. For production, replace that one file with an object storage implementation such as Amazon S3.

### Security
- **Content checked, not just the name:** the first bytes of each file must match a real JPG, PNG, WEBP or PDF, and the extension must agree with the content.
- **Safe filenames:** files are saved as random UUIDs with an extension chosen by the server; user filenames never reach the disk.
- **No direct access:** files are only served through authenticated API routes with permission checks.
- **Not executable:** responses use `X-Content-Type-Options: nosniff` and a sandboxing `Content-Security-Policy`; documents are always sent as downloads.
- **Ownership checked:** a document is looked up by both its ID and the student ID.
- **Private documents:** viewers cannot list or download documents.

### Consistency
- New file saved, then database updated; if the database update fails, the new file is deleted.
- On replace, the old file is deleted only after the database update succeeds.
- Deleting a student deletes their photo, documents and document records.