import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import './CourseDetail.css';

export function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api(`/courses/${courseId}`),
      api(`/courses/${courseId}/sessions`),
    ])
      .then(([c, s]) => {
        if (!cancelled) {
          setCourse(c);
          setSessions(Array.isArray(s) ? s : []);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  async function handleCreateSession(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError('');
    setCreating(true);
    try {
      const session = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ course_id: Number(courseId), title: newTitle.trim() }),
      });
      setSessions((prev) => [session, ...prev]);
      setNewTitle('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="loading">Loading…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="course-detail">
      <nav className="breadcrumb">
        <Link to="/">Courses</Link>
        <span> / </span>
        <span>{course.name}</span>
      </nav>
      <h1>{course.name}</h1>
      <h2>Sessions</h2>
      <form className="session-form" onSubmit={handleCreateSession}>
        <input
          type="text"
          placeholder="New session title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          disabled={creating}
        />
        <button type="submit" disabled={creating || !newTitle.trim()}>
          {creating ? 'Adding…' : 'Add session'}
        </button>
      </form>
      <ul className="session-list">
        {sessions.length === 0 ? (
          <li className="empty">No sessions yet. Add one above.</li>
        ) : (
          sessions.map((s) => (
            <li key={s.id}>
              <Link to={`/sessions/${s.id}`}>{s.title}</Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
