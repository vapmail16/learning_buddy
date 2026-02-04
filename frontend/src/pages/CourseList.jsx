import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import './CourseList.css';

export function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api('/courses')
      .then((data) => { if (!cancelled) setCourses(Array.isArray(data) ? data : []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Enter a course name');
      return;
    }
    setError('');
    setCreating(true);
    try {
      const course = await api('/courses', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      setCourses((prev) => [course, ...prev]);
      setNewName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="loading">Loading courses…</p>;

  return (
    <div className="course-list">
      <h1>Courses</h1>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="course-list-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="New course name"
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setError(''); }}
          disabled={creating}
        />
        <button type="submit" disabled={creating}>
          {creating ? 'Adding…' : 'Add course'}
        </button>
      </form>
      <ul className="course-list-ul">
        {courses.length === 0 ? (
          <li className="course-list-empty">No courses yet. Add one above.</li>
        ) : (
          courses.map((c) => (
            <li key={c.id}>
              <Link to={`/courses/${c.id}`}>{c.name}</Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
