const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();
router.use(requireAuth);

function readStudentInput(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const { physics, chemistry, english } = body;
  const scores = [physics, chemistry, english];

  if (!name || name.length > 100 || !scores.every(score =>
    Number.isInteger(score) && score >= 0 && score <= 100
  )) {
    return { error: "Enter a name and whole-number marks from 0 to 100 for all subjects." };
  }

  return { value: { name, physics, chemistry, english } };
}

router.get("/", async (req, res) => {
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

router.post("/", async (req, res) => {
  const input = readStudentInput(req.body);
  if (input.error) return res.status(400).json({ message: input.error });

  try {
    const student = await Student.create({
      ...input.value,
      owner: req.userId,
      total: 0,
      average: 0
    });
    res.status(201).json(student);
  } catch (error) {
    console.error("Add student:", error.message);
    res.status(500).json({ message: "Could not save the student result." });
  }
});

router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student record." });
  }

  const input = readStudentInput(req.body);
  if (input.error) return res.status(400).json({ message: input.error });

  try {
    const student = await Student.findOne({ _id: req.params.id, owner: req.userId });
    if (!student) return res.status(404).json({ message: "Student result not found." });

    Object.assign(student, input.value);
    await student.save();
    res.json(student);
  } catch (error) {
    console.error("Update student:", error.message);
    res.status(500).json({ message: "Could not update the student result." });
  }
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid student record." });
  }

  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!student) return res.status(404).json({ message: "Student result not found." });
    res.json({ message: "Student result deleted." });
  } catch (error) {
    console.error("Delete student:", error.message);
    res.status(500).json({ message: "Could not delete the student result." });
  }
});

module.exports = router;
