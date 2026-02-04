const coursesRepository = require('../repositories/courses.repository');
const sessionsRepository = require('../repositories/sessions.repository');

async function ensureCourseOwnership(userId, courseId) {
  const course = await coursesRepository.findByIdAndUser(courseId, userId);
  return course !== null;
}

async function create(req, res) {
  try {
    const { course_id: courseId, title, session_date: sessionDate } = req.body;
    if (!courseId || !title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'course_id and title required' });
    }
    const allowed = await ensureCourseOwnership(req.userId, courseId);
    if (!allowed) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const session = await sessionsRepository.create({
      courseId,
      title: title.trim(),
      sessionDate: sessionDate || null,
    });
    return res.status(201).json(session);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create session' });
  }
}

async function get(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const session = await sessionsRepository.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const allowed = await ensureCourseOwnership(req.userId, session.course_id);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get session' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const session = await sessionsRepository.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const allowed = await ensureCourseOwnership(req.userId, session.course_id);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const { title, session_date: sessionDate } = req.body;
    const updated = await sessionsRepository.update(id, {
      title: title != null ? String(title).trim() : session.title,
      sessionDate: sessionDate !== undefined ? sessionDate : session.session_date,
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update session' });
  }
}

async function deleteHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const session = await sessionsRepository.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const allowed = await ensureCourseOwnership(req.userId, session.course_id);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    await sessionsRepository.delete(id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete session' });
  }
}

module.exports = {
  create,
  get,
  update,
  delete: deleteHandler,
};
