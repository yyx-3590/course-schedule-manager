const mongoose = require("mongoose");
const { DAYS, SEASONS } = require("../constants");

const slotSchema = new mongoose.Schema(
  {
    days: {
      type: [{ type: String, enum: DAYS }],
      validate: [(v) => v.length > 0, "Pick at least one day"],
    },
    start: { type: String, required: true },
    end: { type: String, required: true },
    room: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    code: { type: String, default: "" },
    title: { type: String, default: "" },
    termSeason: { type: String, enum: SEASONS, required: true },
    termYear: { type: Number, required: true },
    instructor: { type: String, default: "" },
    contact: { type: String, default: "" },
    schedules: { type: [slotSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// "Autumn 2026", used by the term filter on the client
courseSchema.virtual("term").get(function () {
  return `${this.termSeason} ${this.termYear}`;
});

module.exports = mongoose.model("Course", courseSchema);
