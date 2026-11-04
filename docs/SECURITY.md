# Security review

Review carried out on 4 November 2026 against the Task 18 checklist. Each item lists what was checked, how, and the result.

## Findings fixed during this review

| # | Finding | Severity | Fix | Verified by |
|---|---|---|---|---|
| 1 | Real JWT access and refresh secrets were committed in `server/.env.example` in a public repository. Anyone could have forged login tokens, including admin tokens. | **Critical** | New secrets generated and placed only in `server/.env`; `.env.example` now contains placeholders. The old values remain in Git history but no longer work, because tokens are verified against the new secrets. | Secret scan of tracked files returns nothing; all old tokens rejected after restart |
| 2 | No security headers; `X-Powered-By: Express` revealed the framework | Low | Helmet added; `x-powered-by` disabled | Response includes CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, CORP; no X-Powered-By |
| 3 | Only authentication routes were rate limited | Low | General API limit of 500 requests per 15 minutes per IP (auth routes keep their stricter 20) | Header check; tests use a higher limit only when `NODE_ENV=test` |
| 4 | Lint warnings: missing effect dependencies, setState in effects, impure render, an unused parameter | Low | Fixed in StudentList, StudentPhoto, Footer and errorHandler (`_next` kept because Express needs four parameters) | oxlint: server 0, client 1 accepted (see below) |
| 5 | Mixed line endings (LF/CRLF warnings) | Code quality | `.gitattributes` enforces LF for text files | No more warnings on commit |

## Checklist

| # | Requirement | How it is met | How it was checked |
|---|---|---|---|
| 1 | Secrets only in backend environment variables | MongoDB URI, JWT secrets and SMTP settings are read from `server/.env` | `.env` never in Git history; not tracked; ignored by `.gitignore`; secret scan clean after finding 1 |
| 2 | No secrets in frontend environment | `client/.env` contains only `VITE_API_URL` | File contents reviewed |
| 3 | CORS limited to the frontend | Single origin from `CLIENT_URL`, with credentials | `app.js` reviewed |
| 4 | Validate and sanitize input | Zod schemas on every request body (strict, unexpected fields rejected, values normalized); Mongoose validation | 15 validation tests; API tests |
| 5 | Authentication middleware | `requireAuth` on every `/api` route except login, register, refresh, logout, forgot and reset password | Tests: no token, invalid token, expired token all 401 |
| 6 | Permissions enforced on the backend | `authorize(permission)` on every route; role-based field hiding and edit rules in controllers | 14 permission tests |
| 7 | No access to other users' records | Documents looked up by both document ID and student ID; users cannot change their own role; profile route only affects the logged-in user | Test: document via another student's ID returns 404 |
| 8 | Secure password hashing | bcrypt, cost 12; hashes never returned | Test checks stored value is a bcrypt hash |
| 9 | Token expiry and sessions | Access token 15 minutes; refresh token 7 days; logout, password change, reset and role change increase `tokenVersion` so existing tokens stop working | Tests: expired token, logout, password change and role change all invalidate old tokens |
| 10 | Cookie protection | Refresh cookie is `httpOnly`, `sameSite=strict`, limited to `/api/auth`, and `secure` in production | Test checks `HttpOnly`; `utils/tokens.js` reviewed |
| 11 | CSRF | State-changing requests need the `Authorization: Bearer` header, which browsers never send automatically; the only cookie is `sameSite=strict` and limited to auth routes | Design review |
| 12 | Request size limits | JSON bodies 10 KB; photos 2 MB; documents 5 MB; one file per upload | Upload tests (413 for oversized) |
| 13 | Rate limiting | Login, register, forgot and reset: 20 per 15 minutes; whole API: 500 per 15 minutes | Rate limit tested manually (429) |
| 14 | No stack traces or internal errors to users | Error handler returns "Internal server error" for unexpected errors and logs only the message on the server | `errorHandler.js` reviewed |
| 15 | MongoDB injection | Values must be strings (objects such as `{"$ne": ""}` are rejected); search text is regex-escaped; IDs must be 24 hex characters | Validation tests; query parameter tests |
| 16 | No sensitive data in logs | No passwords, tokens or request bodies logged; email addresses masked (`a***@example.com`); only error codes logged for SMTP failures | Every `console.*` call reviewed |
| 17 | Unused imports and dependencies | oxlint on client and server | 1 accepted warning (below) |
| 18 | Dependency audit | `npm audit` on client and server | Client 0; server production dependencies 0 (see accepted risks) |
| 19 | Indexes and query performance | See table below; list pages and the dashboard use aggregation and indexed fields | Reviewed |
| 20 | Document the checks | This file | |

## Indexes

| Collection | Indexes | Used by |
|---|---|---|
| students | email (unique), createdAt, fullName, course, enrollmentStatus | Duplicate check, sorting, course filter, dashboard grouping |
| users | username (unique), email (unique) | Login, duplicate check |
| courses | code (unique), name, status, instructor | Duplicate check, sorting, status filter, instructor lookups |
| instructors | email (unique), fullName | Duplicate check, sorting |
| studentdocuments | student + createdAt | Listing a student's documents |

Text search uses a case-insensitive regular expression, which cannot fully use an index. This is fine for thousands of records; MongoDB Atlas Search would be needed at a much larger scale.

## Accepted risks

| Item | Reason |
|---|---|
| `npm audit`: 2 moderate issues in `minimatch` through `nodemon` | `nodemon` is a development-only dependency and never runs in production. The suggested `--force` fix would install a very old nodemon. `npm audit --omit=dev` reports 0 vulnerabilities. |
| oxlint: `AuthContext.jsx` exports a hook alongside the provider | Only affects hot reload during development, not security or behaviour |
| Old JWT secrets remain in Git history | Rotated, so they no longer verify any token. Rewriting history was not needed. |
| Password reset link printed to the server console in development | Only when `NODE_ENV` is not `production`. In production the link is sent by email only. |
| MongoDB Atlas network access includes a temporary ISP range during development | The entry is temporary and expires automatically. Production should allow only the server's fixed IP. |
| Uploaded files are not virus scanned | Files are content-checked, stored outside public folders, served with `nosniff` and a sandboxing CSP, and documents are always downloads |

## Before going to production

- Set `NODE_ENV=production` (enables secure cookies and disables the development reset-link log)
- Serve over HTTPS
- Set `CLIENT_URL` to the real frontend address
- Configure real SMTP settings
- Generate new JWT secrets for production
- Restrict Atlas network access to the production server's IP
- Move uploads to object storage such as Amazon S3
