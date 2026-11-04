# MERN Student Management System

A full-stack web application for managing students, courses, instructors and enrollments, built with **MongoDB, Express, React and Node.js**. It includes authentication, role-based permissions, file uploads, email notifications, a reporting dashboard, validation on both client and server, and automated tests.

**Repository:** https://github.com/bindhu-pothannagari/mern-student-manegement

![Home page](docs/screenshots/01-home.png)

---

## Features

### For everyone
- Register, log in and log out (JWT access token with httpOnly refresh cookie)
- Profile, password change and password reset
- Responsive layout for desktop, tablet and mobile
- Public home page with course list, student search and course shortcuts

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

## Screenshots

| | |
|---|---|
| **Home** ![Home](docs/screenshots/01-home.png) | **Courses and steps** ![Home courses](docs/screenshots/02-home-courses.png) |
| **Log in** ![Login](docs/screenshots/03-login.png) | **Dashboard** ![Dashboard](docs/screenshots/04-dashboard.png) |
| **Students** ![Students](docs/screenshots/05-students.png) | **Student details** ![Student details](docs/screenshots/06-student-details.png) |
| **Add student** ![Student form](docs/screenshots/07-student-form.png) | **Courses** ![Courses](docs/screenshots/08-courses.png) |
| **Course details** ![Course details](docs/screenshots/09-course-details.png) | **Instructors** ![Instructors](docs/screenshots/10-instructors.png) |
| **Users (admin)** ![Users](docs/screenshots/11-users.png) | **Viewer: access denied** ![Access denied](docs/screenshots/12-viewer-access-denied.png) |
| **Mobile** ![Mobile](docs/screenshots/13-mobile.png) | |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Recharts, CSS (Jost and Hind fonts) |
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

### Optional: home page photo
Place any landscape photo at `client/public/images/hero.jpg` to show it behind the home page heading. Without it, a dark patterned background is used.

---

## Scripts

| Folder | Command | Purpose |
|---|---|---|
| server | `npm run dev` | Start the API with auto-restart |
| server | `npm start` | Start the API |
| server | `npm test` | Run 79 API tests (in-memory database) |
| server | `npm run seed` | Load demo data |
| server | `npm run set-role -- <email> <role>` | Change a user's role |
| server | `npm run migrate-courses` | One-time conversion of old text courses |
| server | `node scripts/cleanupTestData.js` | List (and with `--confirm`, remove) test students ending in `@example.com` |
| client | `npm run dev` | Start the React app |
| client | `npm run build` | Production build into `client/dist` |
| client | `npm test` | Run 20 component tests |

---

## Project structure
```
mern-practice/
├── client/                React app (Vite)
│   ├── public/images/     Optional hero photo
│   └── src/
│       ├── api/           API client, token refresh, one file per resource
│       ├── components/    Navbar, Footer, InputField, ProtectedRoute, StudentPhoto, ...
│       ├── context/       AuthContext (user, login, logout, permissions)
│       ├── hooks/         useCourseOptions
│       ├── layouts/       MainLayout
│       ├── pages/         One file per page
│       ├── utils/         Validation, permissions, formatting, upload rules
│       ├── test/          Component tests
│       ├── index.css      Base styles
│       └── redesign.css   Theme: colours, fonts, header, home page, footer
├── server/                Express API
│   ├── config/            Database connection, permissions, upload rules
│   ├── controllers/       Request handlers
│   ├── middleware/        Auth, authorize, validate, upload, rate limits, errors
│   ├── models/            Mongoose schemas
│   ├── routes/            Route definitions
│   ├── services/          File storage, email
│   ├── validation/        Zod schemas
│   ├── scripts/           seed, set-role, migrate-courses, cleanupTestData
│   ├── tests/             API tests
│   └── API.md             API reference
└── docs/                  Architecture, database, testing, security, bugs, demo, screenshots
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
| [Development notes](docs/DEVELOPMENT_NOTES.md) | Detailed notes written during each task (authentication, roles, uploads, email, dashboard, validation, Git workflow) |

---

## Testing
```
cd server && npm test     # 79 tests
cd client && npm test     # 20 tests
```
API tests use a temporary in-memory MongoDB and never send real email. See [docs/TESTING.md](docs/TESTING.md).

---

## Known issues and incomplete features
| Area | Limitation |
|---|---|
| Uploads | Stored on local disk; production should use object storage such as Amazon S3. No virus scanning. |
| Email | Sent in-process; a job queue (for example BullMQ) would survive server restarts. Only enrollment confirmation is sent. |
| Search | Case-insensitive regex search; very large datasets would need MongoDB Atlas Search. |
| Sessions | Logging out ends sessions on all devices. |
| Validation | Client and server rules are written separately rather than shared. |
| Courses | One instructor per course. Course cards on the home page use colour panels rather than photos. |
| Dashboard | Shows the last 12 months; no CSV or PDF export. |
| Tests | No end-to-end browser tests; the last-admin rule has no dedicated test. |
| Profile | Changing email does not ask for the password again. |

See [docs/BUGS.md](docs/BUGS.md) for bugs that were found and fixed.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `Could not connect to any servers in your MongoDB Atlas cluster` | Your IP changed. Atlas → Network Access → Add Current IP Address. |
| `Cannot reach the server` in the browser | Start the API (`cd server && npm run dev`) and check `VITE_API_URL`. |
| Logged out after restarting the server | Expected if the JWT secrets changed. Log in again. |
| No `preview:` link for emails | Check you are looking at the terminal running the server, and that `SMTP_HOST` is empty. |
| `git push` fails with "Internal Server Error" | A temporary GitHub problem; run `git push` again. |