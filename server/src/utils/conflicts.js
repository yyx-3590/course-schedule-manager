const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const to12Hour = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

const label = (c) => [c.title, c.code].filter(Boolean).join(" ") || "Untitled course";
const range = (s) => `${to12Hour(s.start)} to ${to12Hour(s.end)}`;
const shortDays = (days) => days.map((d) => d.slice(0, 3)).join(", ");

// Two slots clash when they share a day and their time ranges overlap.
// Back to back classes (one ends when the next starts) are fine.
const sharedDays = (a, b) => {
  const overlap = toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);
  return overlap ? a.days.filter((d) => b.days.includes(d)) : [];
};

// One readable message for each clash between `course` and the courses in `others`.
function findConflicts(course, others) {
  const messages = [];
  for (const other of others) {
    for (const a of course.schedules) {
      for (const b of other.schedules) {
        const days = sharedDays(a, b);
        if (days.length) {
          messages.push(
            `${label(course)} (${range(a)}) clashes with ${label(other)} (${range(b)}) on ${shortDays(days)}`
          );
        }
      }
    }
  }
  return messages;
}

// Clashes between two time slots of the same course.
function findSelfConflicts(course) {
  const messages = [];
  const slots = course.schedules;
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const days = sharedDays(slots[i], slots[j]);
      if (days.length) {
        messages.push(`Time slot ${i + 1} and time slot ${j + 1} overlap on ${shortDays(days)}`);
      }
    }
  }
  return messages;
}

module.exports = { findConflicts, findSelfConflicts };
