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


