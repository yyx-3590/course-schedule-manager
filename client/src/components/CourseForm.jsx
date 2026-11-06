import { useState } from "react";
import { errorMessages } from "../api/client";
import { DAYS, SEASONS } from "../constants";
import ErrorList from "./ErrorList";

const newSlot = () => ({ days: [], start: "", end: "", room: "", notes: "" });

// Rough guess of the current term from today's date
const defaultSeason = () => {
  const month = new Date().getMonth();
  if (month >= 8) return "Fall";
  if (month <= 1) return "Winter";
  if (month <= 5) return "Spring";
  return "Summer";
};

// Builds the form state from a saved course, or a blank form that keeps the given term.
const toForm = (course, term) => {
  if (course) {
    const { termSeason, termYear, title, code, instructor, contact, schedules } = course;
    return { termSeason, termYear, title, code, instructor, contact, schedules: schedules.map((s) => ({ ...s })) };
  }
  return {
    termSeason: term?.termSeason ?? defaultSeason(),
    termYear: term?.termYear ?? new Date().getFullYear(),
    title: "", code: "", instructor: "", contact: "", schedules: [newSlot()],
  };
};

const yearOptions = (selected) => {
  const now = new Date().getFullYear();
  const years = new Set([Number(selected)]);
  for (let y = now - 4; y <= now + 6; y++) years.add(y);
  return [...years].sort((a, b) => a - b);
};

export default function CourseForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSlot = (i, patch) =>
    setForm((f) => ({ ...f, schedules: f.schedules.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const slotField = (i, key) => (e) => setSlot(i, { [key]: e.target.value });
  const toggleDay = (i, day) => {
    const days = form.schedules[i].days;
    setSlot(i, { days: DAYS.filter((d) => (d === day ? !days.includes(day) : days.includes(d))) });
  };
  const addSlot = () => setForm((f) => ({ ...f, schedules: [...f.schedules, newSlot()] }));
  const removeSlot = (i) => setForm((f) => ({ ...f, schedules: f.schedules.filter((_, j) => j !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      await onSubmit({ ...form, termYear: Number(form.termYear) });
      // Keep the term so several courses of the same term are quick to add
      if (!initial) setForm((f) => toForm(null, f));
    } catch (err) {
      setErrors(errorMessages(err));
    } finally {
      setBusy(false);
    }
  };

  // A course saved earlier as "Autumn" keeps that choice until it is edited
  const seasonOptions = SEASONS.includes(form.termSeason) ? SEASONS : [form.termSeason, ...SEASONS];

  return (
    <form className="stack" onSubmit={submit}>
      <div className="grid2">
        <label>
          Term
          <select value={form.termSeason} onChange={set("termSeason")}>
            {seasonOptions.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Year
          <select value={form.termYear} onChange={set("termYear")}>
            {yearOptions(form.termYear).map((y) => <option key={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="grid2">
        <label>Course title<input value={form.title} onChange={set("title")} placeholder="CS" /></label>
        <label>Course code<input value={form.code} onChange={set("code")} placeholder="373" /></label>
      </div>
      <div className="grid2">
        <label>Instructor<input value={form.instructor} onChange={set("instructor")} /></label>
        <label>Instructor email<input type="email" value={form.contact} onChange={set("contact")} /></label>
      </div>

      {form.schedules.map((s, i) => (
        <fieldset className="slot" key={i}>
          <legend>Time slot {i + 1}</legend>
          <div className="days">
            {DAYS.map((d) => (
              <label className="chip" key={d}>
                <input type="checkbox" checked={s.days.includes(d)} onChange={() => toggleDay(i, d)} />
                {d.slice(0, 3)}
              </label>
            ))}
          </div>
          <div className="grid2">
            <label>Start<input type="time" required value={s.start} onChange={slotField(i, "start")} /></label>
            <label>End<input type="time" required value={s.end} onChange={slotField(i, "end")} /></label>
          </div>
          <div className="grid2">
            <label>Room<input value={s.room} onChange={slotField(i, "room")} /></label>
            <label>Notes<input value={s.notes} onChange={slotField(i, "notes")} /></label>
          </div>
          {form.schedules.length > 1 && <button type="button" onClick={() => removeSlot(i)}>Remove slot</button>}
        </fieldset>
      ))}
      <button type="button" onClick={addSlot}>Add time slot</button>

      <ErrorList errors={errors} />
      <div className="row">
        <button className="primary" disabled={busy}>{initial ? "Save changes" : "Add course"}</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
