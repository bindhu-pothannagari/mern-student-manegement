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

