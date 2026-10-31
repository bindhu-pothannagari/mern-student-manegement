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
```

