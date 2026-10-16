const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/students.routes");

const app = express();

app.use(express.json({ limit: "20kb" }));
app.use((req, res, next) => {
  req.body = req.body || {};
  next();
});
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  console.error("Request error:", error.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

module.exports = app;
