# Student API

Base URL: `http://localhost:5000/api/students`

All responses are JSON:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "message": "...", "errors": [...] }`

## Endpoints

| Method | URL | Description | Success |
|---|---|---|---|
| GET | `/api/students` | List all students | 200 |
| GET | `/api/students/:id` | Get one student | 200 |
| POST | `/api/students` | Create a student | 201 |
| PATCH | `/api/students/:id` | Update selected fields | 200 |
| DELETE | `/api/students/:id` | Delete a student | 200 |

## Student fields

| Field | Type | Rules |
|---|---|---|
| fullName | string | required, at least 3 characters |
| email | string | required, unique, valid format, stored lowercase |
| mobile | string | required, 10 digits starting with 6 to 9 |
| gender | string | required, one of: male, female, other |
| course | string | required |
| address | string | required, at least 10 characters |

`_id`, `createdAt` and `updatedAt` are added automatically.

## Example: create

Request: `POST /api/students`

```json
{
  "fullName": "Ravi Kumar",
  "email": "ravi@example.com",
  "mobile": "9123456780",
  "gender": "male",
  "course": "BBA",
  "address": "45 Park Street, Hyderabad"
}
```

Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "_id": "6ae5d7a9fb748d7358f58c32",
    "fullName": "Ravi Kumar",
    "email": "ravi@example.com",
    "mobile": "9123456780",
    "gender": "male",
    "course": "BBA",
    "address": "45 Park Street, Hyderabad",
    "createdAt": "2026-10-31T11:57:29.746Z",
    "updatedAt": "2026-10-31T11:57:29.746Z"
  }
}

## Authentication

All `/api/students` endpoints require `Authorization: Bearer <accessToken>`.
Without a valid token they return `401`.

| Method | Endpoint | Auth | Body | Success |
|---|---|---|---|---|
| POST | /api/auth/register | No | `{ username, email, password }` | 201, `{ accessToken, data: user }` and refresh cookie |
| POST | /api/auth/login | No | `{ email, password }` | 200, `{ accessToken, data: user }` and refresh cookie |
| POST | /api/auth/refresh | Cookie | none | 200, new `accessToken`; 204 if no cookie |
| POST | /api/auth/logout | Cookie | none | 200, cookie cleared, all tokens invalidated |
| GET | /api/auth/me | Bearer | none | 200, current user |
| PATCH | /api/auth/me | Bearer | `{ username?, email? }` | 200, updated user |
| PATCH | /api/auth/password | Bearer | `{ currentPassword, newPassword }` | 200, new tokens |
| POST | /api/auth/forgot-password | No | `{ email }` | 200, same message whether or not the email exists |
| POST | /api/auth/reset-password | No | `{ token, password }` | 200 |

### Rules
- Username: 3–30 characters, letters, numbers and underscores, stored lowercase
- Password: 8–72 characters, at least one letter and one number
- `role` cannot be set through register or profile update; new users are `viewer`
- Login, register, forgot and reset are limited to 20 requests per 15 minutes per IP (429 after that)

### Error responses
| Status | When |
|---|---|
| 400 | Missing or invalid fields, wrong current password, invalid or expired reset link |
| 401 | Missing, invalid or expired token; invalid email or password |
| 409 | Email or username already registered |
| 429 | Too many attempts |

### Example
```
POST /api/auth/login
Content-Type: application/json

{ "email": "smoke@example.com", "password": "Passw0rd1" }
```
```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "data": { "_id": "...", "username": "smoketest", "email": "smoke@example.com", "role": "viewer" }
}

## Roles and permissions

Roles: `admin`, `staff`, `viewer`. New accounts are always `viewer`.

| Permission | admin | staff | viewer |
|---|---|---|---|
| students:read | ✅ | ✅ | ✅ (mobile and address hidden) |
| students:create | ✅ | ✅ | ❌ |
| students:update | ✅ all fields | ✅ all except email | ❌ |
| students:delete | ✅ | ❌ | ❌ |
| users:manage | ✅ | ❌ | ❌ |

- 401: not logged in, or token invalid or expired
- 403: logged in but not allowed (for example, a viewer deleting a student, or staff changing an email)

Rules are defined in `server/config/permissions.js` and enforced by `middleware/authorize.js`. The role is read from the database on every request, not from the token.

## User management (admin only)

| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | /api/users?search=&role=&page=&limit= | none | 200, paginated users |
| PATCH | /api/users/:id/role | `{ "role": "staff" }` | 200, updated user; that user is signed out |
| DELETE | /api/users/:id | none | 200 |

| Status | When |
|---|---|
| 400 | Invalid role, invalid ID, bad query parameters |
| 403 | Not an admin, or trying to change your own role or delete yourself |
| 404 | User not found |
| 409 | Would remove the last admin |

## Creating the first admin

New users are always viewers. To promote a user, run this from the `server` folder (requires database access):

```
npm run set-role -- user@example.com admin
```

After that, admins manage roles from the Users page.

## Courses

All endpoints require login. Reading needs `courses:read` (all roles); create, update and delete need `courses:manage` (admin).

| Method | Endpoint | Body / query | Success |
|---|---|---|---|
| GET | /api/courses | `?search=&status=active\|inactive&page=&limit=` | 200, paginated, each with `studentCount` and `instructor { fullName }` |
| GET | /api/courses/options | none | 200, all courses `{ _id, name, code, status }` for dropdowns |
| GET | /api/courses/:id | none | 200, course with full instructor and `studentCount` |
| GET | /api/courses/:id/students | `?page=&limit=` | 200, enrolled students (role-based field hiding applies) |
| POST | /api/courses | `{ name, code, description?, durationMonths, fee, status?, instructor? }` | 201 |
| PATCH | /api/courses/:id | any of the above | 200 |
| DELETE | /api/courses/:id | none | 200, or 409 if students are enrolled |

Rules: `code` 2–12 letters, numbers or hyphens, unique, stored uppercase. `durationMonths` whole number 1–120. `fee` number ≥ 0. `status` active or inactive. `instructor` must be an existing instructor ID, or null.

## Instructors

Reading needs `instructors:read` (admin, staff); changes need `instructors:manage` (admin).

| Method | Endpoint | Body | Success |
|---|---|---|---|
| GET | /api/instructors | `?search=&page=&limit=` | 200, each with `courseCount` |
| GET | /api/instructors/options | none | 200, `{ _id, fullName, specialization }` |
| GET | /api/instructors/:id | none | 200, instructor with `courses` |
| POST | /api/instructors | `{ fullName, email, specialization }` | 201 |
| PATCH | /api/instructors/:id | any of the above | 200 |
| DELETE | /api/instructors/:id | none | 200; their courses become unassigned |

## Students: course changes

- `course` is now a course **ID**. Responses include `course: { _id, name, code, status }`.
- `GET /api/students?course=<courseId>` filters by course.
- Create and update reject a course ID that is malformed, does not exist, or is **inactive**. A student already in an inactive course can still be edited.
## File uploads

Uploads use `multipart/form-data` with one file in a field named `file`.

| Method | Endpoint | Permission | Success |
|---|---|---|---|
| PUT | /api/students/:id/photo | students:update (admin, staff) | 200, replaces any existing photo |
| GET | /api/students/:id/photo | students:read (all roles) | 200, image file |
| DELETE | /api/students/:id/photo | students:update | 200 |
| GET | /api/students/:id/documents | documents:read (admin, staff) | 200, document list (no storage keys) |
| POST | /api/students/:id/documents | documents:manage (admin, staff) | 201 |
| GET | /api/students/:id/documents/:docId/download | documents:read | 200, file as attachment |
| DELETE | /api/students/:id/documents/:docId | documents:delete (admin) | 200 |

| Rule | Photo | Document |
|---|---|---|
| Types | JPG, PNG, WEBP | PDF, JPG, PNG |
| Max size | 2 MB | 5 MB |
| Max per student | 1 | 20 |

| Status | When |
|---|---|
| 400 | No file, wrong type, extension does not match content |
| 403 | Role not allowed |
| 404 | Student, photo or document not found, or file missing from storage |
| 409 | Document limit reached |
| 413 | File too large |