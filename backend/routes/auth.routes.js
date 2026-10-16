const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post("/register", async (req, res) => {
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
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Register:", error.message);
    res.status(500).json({ message: "Could not create the account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    console.error("Login:", error.message);
    res.status(500).json({ message: "Could not sign in." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (!user) return res.status(401).json({ message: "Account not found. Sign in again." });
    res.json(publicUser(user));
  } catch (error) {
    console.error("Load account:", error.message);
    res.status(500).json({ message: "Could not load your account." });
  }
});

module.exports = router;
