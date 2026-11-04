# Testing

## Running
```
cd server
npm test        # 78 tests

cd client
npm test        # 20 tests
```
The first server run downloads a temporary MongoDB binary; later runs take under a minute.

## Results
| Suite | Files | Tests | Result |
|---|---|---|---|
| Server (API) | 7 | 78 | All passed |
| Client (React) | 4 | 20 | All passed |

A fresh clone from GitHub was also tested: `npm ci` then `npm test` in both folders passed with no local `.env` file, and `npm run build` succeeded.

## Tools
| Tool | Use |
|---|---|
| Vitest | Test runner for both client and server |
| Supertest | Sends HTTP requests to the Express app without starting a server |
| mongodb-memory-server | A temporary MongoDB per test file; real data is never touched |
| React Testing Library + jsdom | Renders components and interacts with them like a user |

Email sending is mocked, uploads go to a temporary folder, and the database is cleared before each test.

## Server tests
| File | Tests | Covers |
|---|---|---|
| auth.test.js | 14 | Register, bcrypt hashing, duplicate email, invalid input, login, identical message for wrong password and unknown email, missing, invalid and expired tokens, current user without sensitive fields, refresh, logout invalidating tokens, password change |
| permissions.test.js | 13 | No token 401; viewers read without mobile or address; viewers cannot create, update or delete; staff create and update but cannot change email or delete; admin delete; documents hidden from viewers; another student's document via a changed URL ID returns 404; user management admin only; admins cannot change their own role; role change signs the user out; users cannot set their role through the profile |
| students.test.js | 18 | Create with course and queued email; duplicate email; missing and inactive course; malformed and unknown IDs; update and delete; malformed JSON; pagination totals; search by name and email; course filter; sorting; invalid query parameters; course code uppercasing and duplicates; invalid instructor; staff cannot create courses; student counts; delete blocked with students; instructor delete unassigns courses; email resend rules |
| uploads.test.js | 8 | Real PNG accepted and served unchanged with `nosniff`; text disguised as an image rejected; extension mismatch rejected; oversized file 413; viewer upload 403; one file kept on replace and none after removal; document upload, list without storage keys and download as attachment; admin-only document delete removes the file |
| dashboard.test.js | 4 | Totals match inserted data; course filter; empty date range; viewer 403 and invalid filters 400 |
| validation.test.js | 15 | Zod schemas: normalization, required fields, formats, unexpected fields, empty updates, password strength, course code, numeric fields, roles |
| email.test.js | 9 | Template content and escaping, no line breaks in subject, sends once, skips duplicates, records failures without throwing, masked logs |

## Client tests
| File | Tests | Covers |
|---|---|---|
| validation.test.js | 5 | Email, username, password and confirmation rules; server errors mapped to fields |
| forms.test.jsx | 6 | Login: empty submit, invalid email marked `aria-invalid`, server error shown, successful login redirects. Signup: mismatched passwords, duplicate email shown under the field |
| protectedRoute.test.jsx | 4 | Session check, redirect to login, Access denied, allowed access |
| studentList.test.jsx | 5 | Loading, empty, error with working Try again, data with total, viewer sees no Mobile column or Edit/Delete/Add buttons |

## Bugs found by testing
See [BUGS.md](BUGS.md). For example, the validation tests caught inconsistent capitalisation in error messages, which was fixed in the code rather than by changing the test.