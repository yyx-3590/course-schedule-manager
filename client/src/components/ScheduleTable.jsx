import { DAYS } from "../constants";
import { to12Hour, toMinutes } from "../utils/time";

export default function ScheduleTable({ courses, fields }) {
  const starts = [...new Set(courses.flatMap((c) => c.schedules.map((s) => s.start)))].sort(
    (a, b) => toMinutes(a) - toMinutes(b)
  );
  if (!starts.length) return <p>No courses yet. Add some on the Courses page.</p>;

  // Title and code share one line, like "CS 373"
  const details = (c, s) => [
    [fields.has("title") && c.title, fields.has("code") && c.code].filter(Boolean).join(" "),
    fields.has("instructor") && c.instructor && `Instructor: ${c.instructor}`,
    fields.has("contact") && c.contact,
    fields.has("room") && s.room && `Room ${s.room}`,
    fields.has("notes") && s.notes,
  ].filter(Boolean);

  return (
    <div className="table-scroll">
      <table className="schedule">
        <thead>
          <tr>
            <th>Time</th>
            {DAYS.map((d) => <th key={d}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {starts.map((start) => (
            <tr key={start}>
              <th scope="row">{to12Hour(start)}</th>
              {DAYS.map((day) => (
                <td key={day}>
                  {courses.flatMap((c, ci) =>
                    c.schedules
                      .filter((s) => s.days.includes(day) && s.start === start)
                      .map((s, i) => (
                        <div className={`block s${ci % 4}`} key={`${c.id}-${i}`}>
                          <strong>{to12Hour(s.start)} to {to12Hour(s.end)}</strong>
                          {details(c, s).map((line, n) => <div key={n}>{line}</div>)}
                        </div>
                      ))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
