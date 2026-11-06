const { findConflicts, findSelfConflicts } = require("../src/utils/conflicts");
const { slot } = require("./helpers");

const course = (title, code, schedules) => ({ title, code, schedules });

describe("findConflicts", () => {
  it("reports an overlap on a shared day", () => {
    const a = course("Algorithms", "CS 373", [slot(["Monday"], "09:00", "10:30")]);
    const b = course("Databases", "CS 340", [slot(["Monday", "Friday"], "10:00", "11:00")]);
    const msgs = findConflicts(a, [b]);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toContain("Algorithms CS 373");
    expect(msgs[0]).toContain("Databases CS 340");
    expect(msgs[0]).toContain("Mon");
  });

  it("allows back to back classes", () => {
    const a = course("A", "1", [slot(["Monday"], "09:00", "10:00")]);
    const b = course("B", "2", [slot(["Monday"], "10:00", "11:00")]);
    expect(findConflicts(a, [b])).toEqual([]);
  });

  it("allows the same time on different days", () => {
    const a = course("A", "1", [slot(["Monday"], "09:00", "10:00")]);
    const b = course("B", "2", [slot(["Tuesday"], "09:00", "10:00")]);
    expect(findConflicts(a, [b])).toEqual([]);
  });

  it("treats a course fully inside another as a clash", () => {
    const a = course("A", "1", [slot(["Friday"], "08:00", "12:00")]);
    const b = course("B", "2", [slot(["Friday"], "09:00", "10:00")]);
    expect(findConflicts(a, [b])).toHaveLength(1);
  });

  it("uses a fallback label for a course with no title or code", () => {
    const a = course("", "", [slot(["Monday"], "09:00", "10:00")]);
    const b = course("B", "2", [slot(["Monday"], "09:30", "10:30")]);
    expect(findConflicts(a, [b])[0]).toContain("Untitled course");
  });
});

describe("findSelfConflicts", () => {
  it("finds two overlapping slots in one course", () => {
    const c = course("A", "1", [slot(["Monday"], "09:00", "10:00"), slot(["Monday", "Tuesday"], "09:30", "11:00")]);
    const msgs = findSelfConflicts(c);
    expect(msgs).toEqual(["Time slot 1 and time slot 2 overlap on Mon"]);
  });

  it("returns nothing for clean slots", () => {
    const c = course("A", "1", [slot(["Monday"], "09:00", "10:00"), slot(["Tuesday"], "09:00", "10:00")]);
    expect(findSelfConflicts(c)).toEqual([]);
  });
});
