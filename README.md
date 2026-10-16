# Student Result Management System

A small full-stack application for recording and reviewing student marks. A user creates an account, signs in, and manages a private list of results for Physics, Chemistry, and English. The app validates marks, calculates each total and average, sorts students by total, and shows a class summary.

## What the app does

- Register and sign in with an email and password.
- Add, search, edit, and delete student result records.
- Accept whole-number marks from 0 to 100 for each of the three subjects.
- Calculate totals out of 300 and averages out of 100 on the server.
- Show the number of records, class average, and top-scoring student.
- Keep each user's student records separate.

## Technology

| Part | Technology | Responsibility |
| --- | --- | --- |
| Frontend | HTML, CSS, browser JavaScript | Sign-in screen, forms, search, dashboard, and API requests |
| Backend | Node.js, Express | Serves the frontend, validates requests, authenticates users, and exposes the REST API |
| Data layer | MongoDB, Mongoose | Stores account and student result documents |
| Account security | bcryptjs, JSON Web Token | Hashes passwords and protects student API routes |

## Folder guide

```text
student-result-management/
├── backend/                         Server-side application
│   ├── config/
│   │   └── database.js              MongoDB connection
│   ├── middleware/
│   │   └── require-auth.js           Validates Bearer tokens
│   ├── models/
│   │   ├── Student.js                Result fields and calculated marks
│   │   └── User.js                   Account fields and password hash
│   ├── routes/
│   │   ├── auth.routes.js            Register, sign in, current account
│   │   └── students.routes.js        List, add, edit, and delete results
│   ├── .env.example                  Local configuration template
│   ├── app.js                        Express middleware and route mounting
│   ├── package.json                  Backend scripts and dependencies
│   ├── package-lock.json             Locked dependency versions
│   └── server.js                     Configuration, database startup, and HTTP listener
├── frontend/                         Browser application served by Express
│   ├── app.js                        UI state, validation, and API calls
│   ├── index.html                    Sign-in and results dashboard markup
│   └── styles.css                    Responsive application styles
├── REPORT.md                         College report draft
├── Full_Stack_Mini_Project_Report_Format.docx  Original college report template
└── README.md                         Project and setup guide
```

There is one backend and one frontend. The backend serves the static frontend, so both use the same local address and no separate frontend server is needed.

## How a request moves through the app

1. `frontend/app.js` sends a JSON request to an `/api` endpoint.
2. `backend/app.js` parses the request and mounts the authentication or student routes.
3. `backend/middleware/require-auth.js` checks the token on protected routes and sets the account ID on the request.
4. A route validates input and calls a Mongoose model in `backend/models/`.
5. Mongoose reads or writes MongoDB, and the route returns JSON to the browser.

The server, database connection, and routes are separate files so a new developer can find each responsibility without searching one large server file.

## Data model

### `users` collection

Stores the account name, normalized unique email, password hash, and timestamps. The original password is never stored. `passwordHash` is excluded from normal model queries.

### `students` collection

Stores the owning account ID, student name, Physics/Chemistry/English marks, calculated total and average, and timestamps. Every student query is scoped to the signed-in account.

## API reference

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Reports API status and MongoDB connection status |
| `POST` | `/api/auth/register` | Public | Creates an account and returns a session token |
| `POST` | `/api/auth/login` | Public | Checks credentials and returns a session token |
| `GET` | `/api/auth/me` | Signed in | Returns the current account |
| `GET` | `/api/students` | Signed in | Lists the current account's results, highest total first |
| `POST` | `/api/students` | Signed in | Adds a student result |
| `PUT` | `/api/students/:id` | Signed in | Updates an owned result |
| `DELETE` | `/api/students/:id` | Signed in | Deletes an owned result |

Protected requests use `Authorization: Bearer <token>`. Student input is JSON with `name`, `physics`, `chemistry`, and `english`. The server rejects marks outside 0–100 and calculates `total` and `average` itself.

## Run locally on Windows

### Requirements

- Node.js 20 or later and npm.
- MongoDB Community Server running locally, or a MongoDB Atlas connection string.

### 1. Configure the database

Open PowerShell in the project folder and create a private environment file:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
notepad .\backend\.env
```

For local MongoDB, keep the example `MONGO_URI`. For Atlas, replace it with your database connection string. Generate a private JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the generated value after `JWT_SECRET=` in `backend/.env`. The file should look like this, with your generated value in place of the example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_result_management
JWT_SECRET=your-private-random-value-at-least-32-characters-long
```

Keep `backend/.env` private. It is excluded by `.gitignore`.

### 2. Install and start

In the same PowerShell window:

```powershell
Set-Location .\backend
npm install
npm start
```

When the console reports that MongoDB connected and the server is running, open **http://localhost:5000**. Register an account and add a student record. Keep this terminal open while using the app; press `Ctrl+C` to stop the server.

### 3. Confirm the API connection

Open **http://localhost:5000/api/health**. A working local setup returns JSON similar to:

```json
{"status":"ok","database":"connected"}
```

### Common setup issues

- **`MONGO_URI is required`**: create `backend/.env` from the example and check that it contains `MONGO_URI`.
- **MongoDB connection refused**: start MongoDB Community Server or use a reachable Atlas URI.
- **`JWT_SECRET must be set`**: set a private value at least 32 characters long in `backend/.env`.
- **Port 5000 is already in use**: stop the other process or set another `PORT` in `backend/.env`, then open the matching port in your browser.

## College report

`REPORT.md` contains the project overview, objectives, system design, modules, database design, implementation summary, and conclusion. Before submission, fill in your name, roll number, and class; run the project; add genuine screenshots; and replace the report's “To run” test statuses with your results. The supplied Word report format is included as `Full_Stack_Mini_Project_Report_Format.docx`.

## Development notes

- `backend/server.js` starts the app. It loads environment variables, checks configuration, connects to MongoDB, then listens for requests.
- `backend/app.js` configures Express, serves `frontend/`, mounts API routes, and handles unknown routes.
- Keep secrets in `backend/.env`; never commit that file.
- Install backend dependencies from `backend/` with `npm install`.
