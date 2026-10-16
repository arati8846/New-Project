const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/User");
const Student = require("./models/Student");

const app = express();
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Sign in to continue." });
  }

  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    return res.status(401).json({ message: "Your session expired. Sign in again." });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Enter your name and a valid email address." });
    }
    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be 8–72 bytes long." });
    }
    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12)
    });
    res.status(201).json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Register:", error.message);
    res.status(500).json({ message: "Could not create the account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    res.json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login:", error.message);
    res.status(500).json({ message: "Could not sign in." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("name email");
  if (!user) return res.status(401).json({ message: "Account not found. Sign in again." });
  res.json({ id: user.id, name: user.name, email: user.email });
});

app.get("/api/students", requireAuth, async (req, res) => {
  try {
    const students = await Student.find({ owner: req.userId })
      .select("name physics chemistry english total average createdAt updatedAt")
      .sort({ total: -1, name: 1 });
    res.json(students);
  } catch (error) {
    console.error("List students:", error.message);
    res.status(500).json({ message: "Could not load student results." });
  }
});

app.post("/api/students", requireAuth, async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const { physics, chemistry, english } = req.body;
    if (!name || name.length > 100 || ![physics, chemistry, english].every(score => Number.isInteger(score) && score >= 0 && score <= 100)) {
      return res.status(400).json({ message: "Enter a name and whole-number marks from 0 to 100 for all subjects." });
    }
    const student = await Student.create({ owner: req.userId, name, physics, chemistry, english, total: 0, average: 0 });
    res.status(201).json(student);
  } catch (error) {
    console.error("Add student:", error.message);
    res.status(500).json({ message: "Could not save the student result." });
  }
});

app.put("/api/students/:id", requireAuth, async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const { physics, chemistry, english } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid student record." });
    if (!name || name.length > 100 || ![physics, chemistry, english].every(score => Number.isInteger(score) && score >= 0 && score <= 100)) {
      return res.status(400).json({ message: "Enter a name and whole-number marks from 0 to 100 for all subjects." });
    }
    const student = await Student.findOne({ _id: req.params.id, owner: req.userId });
    if (!student) return res.status(404).json({ message: "Student result not found." });
    student.name = name;
    student.physics = physics;
    student.chemistry = chemistry;
    student.english = english;
    await student.save();
    res.json(student);
  } catch (error) {
    console.error("Update student:", error.message);
    res.status(500).json({ message: "Could not update the student result." });
  }
});

app.delete("/api/students/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid student record." });
    const student = await Student.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!student) return res.status(404).json({ message: "Student result not found." });
    res.json({ message: "Student result deleted." });
  } catch (error) {
    console.error("Delete student:", error.message);
    res.status(500).json({ message: "Could not delete the student result." });
  }
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  console.error("Request error:", error.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required. Copy backend/.env.example to backend/.env.");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be set to a random value at least 32 characters long.");
  await mongoose.connect(process.env.MONGO_URI);
  app.listen(port, () => console.log(`Student Results is running at http://localhost:${port}`));
}

if (require.main === module) {
  startServer().catch(error => {
    console.error("Startup error:", error.message);
    process.exit(1);
  });
}

module.exports = app;
