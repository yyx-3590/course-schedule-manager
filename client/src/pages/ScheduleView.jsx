import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import ScheduleTable from "../components/ScheduleTable";
import { compareTerms } from "../utils/time";

const THEMES = { default: "Husky", sunset: "Sunset", ocean: "Ocean", forest: "Forest", mono: "Mono" };
const FIELDS = [
  ["title", "Course title"], ["code", "Course code"], ["instructor", "Instructor"],
  ["contact", "Email"], ["room", "Room"], ["notes", "Notes"],
];

export default function ScheduleView() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [theme, setTheme] = useState("default");
  const [fields, setFields] = useState(() => new Set(["title", "code", "room", "notes"]));

  useEffect(() => {
    api.listCourses().then(setCourses).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const terms = useMemo(() => [...new Set(courses.map((c) => c.term))].sort(compareTerms), [courses]);
  const activeTerm = term || terms[terms.length - 1] || "";

  const toggleField = (key) =>
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="schedule-wrap" data-theme={theme}>
      <div className="row no-print">
        <h1>Weekly schedule</h1>
        <label>
          Term
          <select value={activeTerm} onChange={(e) => setTerm(e.target.value)} disabled={!terms.length}>
            {terms.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Color theme
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            {Object.entries(THEMES).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
        </label>
        <button className="primary" onClick={() => window.print()}>Print or save as PDF</button>
      </div>

      <fieldset className="options no-print">
        <legend>Show on schedule</legend>
        {FIELDS.map(([key, label]) => (
          <label className="chip" key={key}>
            <input type="checkbox" checked={fields.has(key)} onChange={() => toggleField(key)} />
            {label}
          </label>
        ))}
      </fieldset>

      {activeTerm && <h2>{activeTerm}</h2>}
      {error && <p className="error" role="alert">{error}</p>}
      {loading ? <p>Loading schedule...</p> : (
        <ScheduleTable courses={courses.filter((c) => c.term === activeTerm)} fields={fields} />
      )}
    </div>
  );
}
