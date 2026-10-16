const mongoose = require("mongoose");

const scoreRule = {
  type: Number,
  required: true,
  min: 0,
  max: 100,
  validate: Number.isInteger
};

const studentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    physics: scoreRule,
    chemistry: scoreRule,
    english: scoreRule,
    total: { type: Number, required: true, min: 0, max: 300 },
    average: { type: Number, required: true, min: 0, max: 100 }
  },
  { timestamps: true }
);

studentSchema.pre("validate", function calculateResult(next) {
  if ([this.physics, this.chemistry, this.english].every(Number.isInteger)) {
    this.total = this.physics + this.chemistry + this.english;
    this.average = Math.round((this.total / 3) * 10) / 10;
  }
  next();
});

studentSchema.index({ owner: 1, total: -1 });

module.exports = mongoose.model("Student", studentSchema);
