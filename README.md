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
## Email notifications

### What is sent
An enrollment confirmation (student name, course name and code, duration, enrollment date) is sent to the student after they are registered.

### Configuration (server/.env)
| Variable | Purpose |
|---|---|
| EMAIL_FROM_NAME | Sender name, e.g. `Student Management System` |
| EMAIL_FROM_ADDRESS | Sender address, e.g. `no-reply@yourdomain.com` |
| SMTP_HOST | SMTP server. **Leave empty in development** to use an automatic Ethereal test inbox |
| SMTP_PORT | Usually 587 (or 465 with SMTP_SECURE=true) |
| SMTP_SECURE | `true` for port 465, otherwise `false` |
| SMTP_USER, SMTP_PASS | SMTP login |

In development without `SMTP_HOST`, no real emails are sent. The server log prints a `preview:` link to view each email. In production, a missing `SMTP_HOST` is an error.

Credentials live only in `server/.env`, never in the frontend or the repository.

### Reliability
- **Saved first:** the student is saved, then the email is sent in the background. A failed email never removes or blocks the enrollment.
- **No duplicates:** each send first claims the record atomically (only `pending` or `failed` can become `sending`), so repeated or simultaneous attempts send at most one email.
- **Retry:** a failed email can be resent from the student page (admin or staff).
- **Logging:** logs record the student ID, a masked address (`a***@example.com`), the status and an error code. No full addresses, credentials or message contents.
- **Template:** `services/email/templates/enrollmentConfirmation.js` returns HTML and plain text; user data is HTML-escaped and kept out of the subject's line breaks.

### Tests
```
cd server
npm test
```
Tests use fake senders and never send real email. They cover the template content, HTML escaping, sending once, skipping duplicates, recording failures without throwing, and masked logging.

### Larger workloads
Emails are sent in-process. For high volume, move sending to a job queue (for example BullMQ with Redis) so retries survive server restarts.
## Dashboard and reports

The dashboard (admin and staff) shows total students, active courses, instructors, students per course, students by enrollment status, monthly enrollment activity and recently registered students, with date-range and course filters.

### How the figures are calculated
- One MongoDB aggregation with `$facet` computes the total, per-course, per-status, per-month and recent lists over the same filtered students in a single query.
- Course and status lists are built from the full set of courses and statuses, so items with 0 students still appear.
- Month grouping uses the `REPORT_UTC_OFFSET` time zone (default India, `+05:30`).
- Students created before enrollment status existed are counted as active.
- Indexes on `createdAt`, `course` and `enrollmentStatus` support the filters and grouping.

### Verifying the figures
The dashboard totals were checked against the student, course and instructor lists, and the per-course, per-status and per-month counts were confirmed to add up to the student total.

### Troubleshooting: "Could not connect to any servers in your MongoDB Atlas cluster"
Your internet IP address has changed. In MongoDB Atlas, open **Network Access**, click **Add IP Address**, then **Add Current IP Address**. Avoid allowing access from anywhere (0.0.0.0/0).

## Automated tests

### Running
```
cd server
npm test

cd client
npm test
```
The first server run downloads a temporary MongoDB binary (a few minutes); later runs take under a minute.

### Server (Vitest + Supertest + mongodb-memory-server), 78 tests
| File | Covers |
|---|---|
| auth.test.js | Register, hashed passwords, duplicates, invalid input, login, same message for wrong password and unknown email, missing, invalid and expired tokens, refresh, logout invalidating tokens, password change |
| permissions.test.js | Viewer, staff and admin rules for students, hidden fields, documents, user management, changing IDs in URLs, role changes signing users out, users cannot change their own role |
| students.test.js | Student CRUD, duplicate email, invalid and missing IDs, inactive courses, malformed JSON, search, course filter, pagination, sorting, invalid query parameters, courses, instructors, delete rules, email resend |
| uploads.test.js | Valid and fake images, extension mismatch, size limit, viewer blocked, served bytes match, file cleanup on replace and delete, documents as attachments, admin-only delete |
| dashboard.test.js | Figures match inserted data, course filter, empty range, permissions, invalid filters |
| validation.test.js | Zod schemas: required fields, formats, unexpected fields, normalization |
| email.test.js | Email template, sending once, duplicates skipped, failures recorded, masked logs |

- Each test file uses its own in-memory MongoDB; nothing touches the real database.
- Email sending is mocked; no real emails are sent.
- Uploads go to a temporary folder.

### Client (Vitest + React Testing Library + jsdom)
| File | Covers |
|---|---|
| validation.test.js | Client validation rules and mapping server errors to fields |
| forms.test.jsx | Login and signup: field errors, invalid fields, server errors, successful login redirect |
| protectedRoute.test.jsx | Session check, redirect to login, Access denied, allowed access |
| studentList.test.jsx | Loading, empty, error with Try again, data, and role-based columns and buttons |

### Bugs
See `docs/BUGS.md` for bugs found during development, how to reproduce them, and how each fix is verified.

# MERN Student Management System

A full-stack web application for managing students, courses, instructors and enrollments, built with **MongoDB, Express, React and Node.js**. It includes authentication, role-based permissions, file uploads, email notifications, a reporting dashboard, validation on both client and server, and automated tests.

**Repository:** https://github.com/bindhu-pothannagari/mern-student-manegement

---

## Features

### For everyone
- Register, log in and log out (JWT access token with httpOnly refresh cookie)
- Profile, password change and password reset
- Responsive layout for desktop, tablet and mobile

### Students
- Create, view, edit and delete students, with confirmation before deleting
- Search by name or email, filter by course and gender, sort by name or date
- Pagination with 10, 25 or 50 per page; filters kept in the URL
- Enrollment status: active, completed, withdrawn, suspended
- Profile photo upload (JPG, PNG, WEBP, up to 2 MB)
- Private supporting documents (PDF, JPG, PNG, up to 5 MB)
- Enrollment confirmation email with failure handling and resend

### Courses and instructors
- Course management: name, code, description, duration, fee, status, instructor
- Student counts per course, and a course details page with enrolled students
- Instructor management, with the courses each one teaches
- Safe deletion: a course with students cannot be deleted; deleting an instructor unassigns their courses

### Dashboard
- Totals for students, active courses and instructors
- Students per course, students by enrollment status, monthly enrollments, recent registrations
- Filters by date range and course

### Roles
| | Admin | Staff | Viewer |
|---|---|---|---|
| View and search students | ✅ | ✅ | ✅ (no mobile or address) |
| Add and edit students | ✅ | ✅ (not email) | ❌ |
| Delete students | ✅ | ❌ | ❌ |
| Courses | Manage | View | View |
| Instructors | Manage | View | ❌ |
| Documents | View, upload, delete | View, upload | ❌ |
| Dashboard | ✅ | ✅ | ❌ |
| Users and roles | ✅ | ❌ | ❌ |

All permissions are enforced on the server; the interface only hides what a role cannot use.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas with Mongoose |
| Auth | JSON Web Tokens, bcrypt, httpOnly cookies |
| Validation | Zod (server), custom validators (client), Mongoose |
| Uploads | Multer with content checks, local disk storage |
| Email | Nodemailer (Ethereal test inbox in development) |
| Security | Helmet, express-rate-limit, CORS |
| Testing | Vitest, Supertest, mongodb-memory-server, React Testing Library |

---

## Getting started

### Prerequisites
- **Node.js 20 or newer** and npm
- **Git**
- A **MongoDB Atlas** account (the free tier is enough)

### 1. Clone and install
```
git clone https://github.com/bindhu-pothannagari/mern-student-manegement.git
cd mern-student-manegement

cd server
npm install
cd ../client
npm install
```

### 2. Set up MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. **Database Access:** add a database user with a strong password
3. **Network Access:** click **Add IP Address**, then **Add Current IP Address**
4. **Connect → Drivers:** copy the connection string and replace `<password>` with your user's password

### 3. Configure the server
Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/studentdb` |
| `PORT` | API port | `5000` |
| `JWT_ACCESS_SECRET` | Long random string | see below |
| `JWT_REFRESH_SECRET` | A different long random string | see below |
| `ACCESS_TOKEN_TTL` | Access token lifetime | `15m` |
| `REFRESH_TOKEN_TTL` | Refresh token lifetime | `7d` |
| `CLIENT_URL` | Frontend address (CORS and links) | `http://localhost:5173` |
| `UPLOAD_DIR` | Folder for uploaded files | `uploads` |
| `EMAIL_FROM_NAME` | Sender name | `Student Management System` |
| `EMAIL_FROM_ADDRESS` | Sender address | `no-reply@example.com` |
| `SMTP_HOST` | SMTP server; **leave empty in development** | |
| `SMTP_PORT`, `SMTP_SECURE` | Usually `587` and `false` | |
| `SMTP_USER`, `SMTP_PASS` | SMTP login | |
| `REPORT_UTC_OFFSET` | Time zone for dashboard months | `+05:30` |

Generate each secret with:
```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Email:** with `SMTP_HOST` empty, emails go to a free Ethereal test inbox and the server log prints a `preview:` link to view each one. For real email, set the SMTP values from your provider (for example Brevo, Mailtrap, SendGrid or Gmail with an app password).

### 4. Configure the client
Copy `client/.env.example` to `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```
This file contains no secrets.

### 5. Load demo data
```
cd server
npm run seed
```
This creates demo accounts, 3 instructors, 5 courses and 24 students spread over six months. It refuses to run in production, and `npm run seed -- --reset` recreates it.

### 6. Run
Two terminals:
```
cd server
npm run dev
```
```
cd client
npm run dev
```
Open http://localhost:5173

### Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.example.com | Demo@1234 |
| Staff | staff@demo.example.com | Demo@1234 |
| Viewer | viewer@demo.example.com | Demo@1234 |

To promote any other account: `cd server && npm run set-role -- user@example.com admin`

---

## Scripts

| Folder | Command | Purpose |
|---|---|---|
| server | `npm run dev` | Start the API with auto-restart |
| server | `npm start` | Start the API |
| server | `npm test` | Run 78 API tests (in-memory database) |
| server | `npm run seed` | Load demo data |
| server | `npm run set-role -- <email> <role>` | Change a user's role |
| server | `npm run migrate-courses` | One-time conversion of old text courses |
| client | `npm run dev` | Start the React app |
| client | `npm run build` | Production build into `client/dist` |
| client | `npm test` | Run 20 component tests |

---

## Project structure
```
mern-practice/
├── client/                React app (Vite)
│   └── src/
│       ├── api/           API client, token refresh, one file per resource
│       ├── components/    Navbar, Footer, InputField, ProtectedRoute, StudentPhoto, ...
│       ├── context/       AuthContext (user, login, logout, permissions)
│       ├── hooks/         useCourseOptions
│       ├── layouts/       MainLayout
│       ├── pages/         One file per page
│       ├── utils/         Validation, permissions, formatting, upload rules
│       └── test/          Component tests
├── server/                Express API
│   ├── config/            Database connection, permissions, upload rules
│   ├── controllers/       Request handlers
│   ├── middleware/        Auth, authorize, validate, upload, rate limits, errors
│   ├── models/            Mongoose schemas
│   ├── routes/            Route definitions
│   ├── services/          File storage, email
│   ├── validation/        Zod schemas
│   ├── scripts/           seed, set-role, migrate-courses
│   ├── tests/             API tests
│   └── API.md             API reference
└── docs/                  Architecture, database, testing, security, bugs, demo
```

---

## Documentation

| Document | Contents |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | How the parts fit together, request flow, authentication, key decisions |
| [Database](docs/DATABASE.md) | Collections, fields, relationships, indexes |
| [API reference](server/API.md) | Every endpoint with request formats, responses and status codes |
| [Testing](docs/TESTING.md) | Test suites, what they cover, how to run them, results |
| [Security review](docs/SECURITY.md) | Checks performed, findings fixed, accepted risks |
| [Bug log](docs/BUGS.md) | Bugs found, reproduction steps, fixes |
| [Demo script](docs/DEMO.md) | Step-by-step walkthrough for a demonstration |
| [Development notes](docs/DEVELOPMENT_NOTES.md) | Detailed notes written during each