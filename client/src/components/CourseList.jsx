import { to12Hour } from "../utils/time";

export default function CourseList({ courses, selected, onToggle }) {
  if (!courses.length) return <p>No courses yet. Add your first one with the form.</p>;

  return (
    <ul className="courses">
      {courses.map((c) => (
        <li key={c.id} className="course">
          <input
            type="checkbox"
            aria-label={`Select ${c.title || c.code}`}
            checked={selected.has(c.id)}
            onChange={() => onToggle(c.id)}
          />
          <div>
            <h3>{[c.title, c.code].filter(Boolean).join(" ")}</h3>
            <p><span className="tag">{c.term}</span></p>
            {c.schedules.map((s, i) => (
              <p className="slot-line" key={i}>
                {s.days.map((d) => d.slice(0, 3)).join(", ")} {to12Hour(s.start)} to {to12Hour(s.end)}
                {s.room && `, room ${s.room}`}
                {s.notes && `, ${s.notes}`}
              </p>
            ))}
            {(c.instructor || c.contact) && (
              <p className="muted">
                {c.instructor} {c.contact && <a href={`mailto:${c.contact}`}>{c.contact}</a>}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
