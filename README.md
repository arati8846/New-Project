# Student Result Management System

A full stack mini project based on the student marks calculator in the supplied repository. It provides account sign-in, private student result records, marks for Physics, Chemistry, and English, automatic total and average calculation, search, editing, deletion, and a class topper summary.

## Technology

- Frontend: HTML, CSS, and browser JavaScript
- Backend: Node.js and Express REST API
- Database: MongoDB with Mongoose
- Account security: bcrypt password hashing and signed JWT sessions

## Project structure

```text
backend/
  models/User.js       Account schema
  models/Student.js    Result schema and calculated marks
  server.js            REST API and static frontend server
  .env.example         Local configuration template
frontend/
  index.html           Sign-in and results dashboard
  styles.css           Responsive interface
  app.js               Forms, API calls, search, and summaries
REPORT.md              College mini-project report draft
Full_Stack_Mini_Project_Report_Format.docx  Supplied report template
```

The API also serves the frontend, so one local server runs both parts at `http://localhost:5000`.

## Run locally

Requirements: Node.js 20 or newer, npm, and MongoDB Community Server or a MongoDB Atlas database.

1. Start MongoDB locally, or create a database in MongoDB Atlas.
2. From the project folder, create the backend configuration:

   ```powershell
   Copy-Item .\backend\.env.example .\backend\.env
   ```

3. Edit `backend/.env`. Set `MONGO_URI` to your local or Atlas connection string. Set `JWT_SECRET` to a private random value of at least 32 characters. Generate one with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Install packages and start the app from the `backend` folder:

   ```powershell
   Set-Location .\backend
   npm install
   npm start
   ```

5. Open `http://localhost:5000`. Create an account, then add student result records. Restart the Node process after changing backend code.

The `/api/health` endpoint reports API and database connection status. Each account can read or change only its own student results. Do not commit `backend/.env`.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and database status |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in and receive a session token |
| GET | `/api/auth/me` | Get the signed-in account |
| GET | `/api/students` | List the account's results, ranked by total |
| POST | `/api/students` | Add a result |
| PUT | `/api/students/:id` | Update a result |
| DELETE | `/api/students/:id` | Delete a result |

Student endpoints require `Authorization: Bearer <token>`. Each score must be a whole number from 0 to 100. The server calculates the total and average.

## Assignment report

See [REPORT.md](REPORT.md) for the project overview, objectives, architecture, modules, database design, implementation summary, and conclusion. Fill in your student details, run the listed checks on your machine, and add genuine screenshots in the marked places before submitting.
