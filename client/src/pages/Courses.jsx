import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import CourseForm from "../components/CourseForm";
import CourseList from "../components/CourseList";
import { compareTerms } from "../utils/time";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      setCourses(await api.listCourses());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const terms = useMemo(() => [...new Set(courses.map((c) => c.term))].sort(compareTerms), [courses]);
  const visible = useMemo(() => courses.filter((c) => !term || c.term === term), [courses, term]);
  const chosen = visible.filter((c) => selected.has(c.id));
  const allChosen = visible.length > 0 && chosen.length === visible.length;

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async (data) => {
    if (editing) await api.updateCourse(editing.id, data);
    else await api.createCourse(data);
    setEditing(null);
    setSelected(new Set());
    await load();
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${chosen.length} selected course(s)?`)) return;
    try {
      await api.deleteCourses(chosen.map((c) => c.id));
      setSelected(new Set());
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="split">
      <section className="panel">
        <h2>{editing ? "Edit course" : "Add a course"}</h2>
        <CourseForm
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={save}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </section>

      <section className="stack">
        <h2>Your courses</h2>
        <div className="toolbar">
          <label>
            Term
            <select value={term} onChange={(e) => setTerm(e.target.value)} disabled={!terms.length}>
              <option value="">{terms.length ? "All terms" : "No terms yet"}</option>
              {terms.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <button disabled={!visible.length} onClick={() => setSelected(allChosen ? new Set() : new Set(visible.map((c) => c.id)))}>
            {allChosen ? "Clear selection" : "Select all"}
          </button>
          <button
            disabled={chosen.length !== 1}
            onClick={() => {
              setEditing(chosen[0]);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Edit selected
          </button>
          <button className="danger" disabled={!chosen.length} onClick={remove}>Delete selected</button>
        </div>
        {!loading && !terms.length && <p className="muted">Terms show up here after you add your first course.</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? <p>Loading courses...</p> : <CourseList courses={visible} selected={selected} onToggle={toggle} />}
      </section>
    </div>
  );
}
