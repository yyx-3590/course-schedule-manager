const { z } = require("zod");
const { DAYS, SEASONS } = require("../constants");
const { findSelfConflicts } = require("../utils/conflicts");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM");

const slotSchema = z
  .object({
    days: z.array(z.enum(DAYS)).min(1, "Pick at least one day"),
    start: time,
    end: time,
    room: z.string().trim().max(50).default(""),
    notes: z.string().trim().max(200).default(""),
  })
  .refine((s) => s.start < s.end, {
    message: "Start time must be earlier than end time",
    path: ["end"],
  });

const courseSchema = z
  .object({
    code: z.string().trim().max(30).default(""),
    title: z.string().trim().max(120).default(""),
    termSeason: z.enum(SEASONS),
    termYear: z.coerce.number().int().min(2000).max(2100),
    instructor: z.string().trim().max(100).default(""),
    contact: z.union([z.literal(""), z.string().trim().email("Invalid email address")]).default(""),
    schedules: z.array(slotSchema).min(1, "Add at least one time slot"),
  })
  .refine((c) => c.code || c.title, {
    message: "Provide a course code or a course title",
    path: ["code"],
  })
  .superRefine((c, ctx) => {
    for (const message of findSelfConflicts(c)) {
      ctx.addIssue({ code: "custom", message, path: ["schedules"] });
    }
  });

const deleteManySchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid id")).min(1),
});

module.exports = { courseSchema, deleteManySchema };
