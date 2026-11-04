
1. Start the API: `cd server && npm run dev` (check `MongoDB connected`)
2. Start the client: `cd client && npm run dev`
3. Load demo data if needed: `cd server && npm run seed`
4. Open http://localhost:5173 in Chrome
5. Have a small PNG and a PDF ready for uploads

Demo accounts (password `Demo@1234` for all): `admin@demo.example.com`, `staff@demo.example.com`, `viewer@demo.example.com`

## 1. Authentication (1 min)
- Show **Sign up** validation (mismatched passwords), then **Log in** with a wrong password: "Invalid email or password"
- Log in as **admin**; refresh the page to show the session survives (refresh cookie)

## 2. Dashboard (1.5 min)
- Cards, students per course, enrollment status chart, monthly chart, recent students
- Filter by **course** and by a **date range**; pick a range with no data to show the empty state

## 3. Students (2 min)
- Search by name, filter by course, sort by name, change page size, go to page 2
- Refresh to show filters kept in the URL
- **Add student** with invalid data (field errors), then valid data
- Open the student: course link, enrollment status, **confirmation email: Sent**
- Upload a **photo**; try a fake image and show it is rejected
- Upload a **document** and download it

## 4. Courses and instructors (1.5 min)
- Course list with student counts and instructors; open a course to see enrolled students
- Try to **delete a course with students**: blocked, with the reason
- Instructors list with course counts

## 5. Roles (2 min)
- Log in as **staff**: can add and edit, email field locked, no Delete, no Users page
- Log in as **viewer**: read-only, no mobile or address, no documents, no Dashboard; open `/users` → Access denied
- As **admin**, open **Users** and change a role; that user is signed out

## 6. Behind the scenes (2 min)
- Run `cd server && npm test` → 78 passed
- Show `docs/SECURITY.md` (the leaked-secret finding and how it was fixed)
- Show a pull request on GitHub with its description, testing and screenshots

## Questions to be ready for
| Question | Short answer |
|---|---|
| How does React talk to Express? | `api/client.js` sends fetch requests with a Bearer token and refreshes it on 401 |
| How does Express talk to MongoDB? | Mongoose models; controllers call `find`, `create`, `findByIdAndUpdate`, `aggregate` |
| How are permissions enforced? | `authorize()` middleware and field rules on the server; the UI only hides buttons |
| Why can't a viewer see mobile numbers even with dev tools? | The server never sends those fields to viewers |
| What happens if email fails? | The student stays saved; status becomes failed; staff can resend |
| How do you stop fake files? | Checks the file's first bytes, not its name; random filenames; never served as a web page |