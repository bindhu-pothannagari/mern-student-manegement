# Bug log

Bugs found during development and testing, how to reproduce them, the fix, and how the fix is verified.

| # | Bug | How to reproduce (before the fix) | Cause | Fix | Verified by |
|---|---|---|---|---|---|
| 1 | Student list showed a blank page | Run the course migration, log in, open `/students` | After students were linked to courses, the API returned `course` as an object, and the table rendered the object directly (React error "Objects are not valid as a React child") | Render `s.course?.code` instead of `s.course` | `studentList.test.jsx` renders the course code; manual check |
| 2 | Staff could never save a student edit | Log in as staff, edit any student, click Update | The form always sent `email`, even unchanged, and staff are not allowed to change email, so the server returned 403 | The edit form sends only the fields the role may change | `permissions.test.js` (staff update succeeds, email change 403); manual check |
| 3 | Invalid ID on user routes said "Invalid student ID" | `PATCH /api/users/123/role` as admin | The ID middleware had a student-specific message | Generic "Invalid ID format" message | Users API test script |
| 4 | Duplicate course code or instructor email said "A student with this ... already exists" | Create two courses with the same code | Duplicate-key handler was written for students only | Generic "A record with this ... already exists" | `students.test.js` (duplicate course code 409) |
| 5 | Student indexes might never be created | Inspect indexes on a fresh database | `studentSchema.index(...)` calls were placed after `mongoose.model(...)` | Moved the index declarations above the model | Course filter and sort tests; dashboard tests |
| 6 | Missing-field errors used inconsistent capitals ("Full Name is required") | `POST /api/students` with an empty body | Field-name formatter capitalised every word | Capitalise only the first word | `validation.test.js` (expects "Full name is required") |
| 7 | `Signup.jsx` imported under a different filename case | Clone on Linux and run the build | The file was saved as `signup.jsx` but imported as `./pages/Signup` (works on Windows only) | Renamed the file to `Signup.jsx` | VS Code problem cleared; client tests import `Signup` |
| 8 | Student registration page failed to compile | Open Add student after an edit | The file was saved incomplete (cut off mid-JSX) | Restored the missing end of the file | Page loads; form tests |
| 9 | Automated login tests would hit the rate limit | Run the auth tests repeatedly | Login is limited to 20 attempts per 15 minutes | Higher limit only when `NODE_ENV=test` | 78 API tests pass repeatedly |

## Development environment issues (not code bugs)

| Issue | Symptom | Fix |
|---|---|---|
| MongoDB Atlas IP allow list | `Could not connect to any servers in your MongoDB Atlas cluster` after the internet IP changed | Atlas → Network Access → add the current IP (or the ISP's range, temporarily) |
| Two server processes running | Requests answered by an old server; logs appeared in a different terminal | Stop all Node processes and run one server terminal |
