const coursesRepository = require('../repositories/courses.repository');
const sessionsRepository = require('../repositories/sessions.repository');

async function create(req, res) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name required' });
    }
    const course = await coursesRepository.create({ userId: req.userId, name: name.trim() });
    return res.status(201).json(course);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create course' });
  }
}

async function list(req, res) {
  try {
    const courses = await coursesRepository.findByUser(req.userId);
    return res.json(courses);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list courses' });
  }
}

async function get(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const course = await coursesRepository.findByIdAndUser(id, req.userId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get course' });
  }
}

async function update(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name required' });
    }
    const course = await coursesRepository.update(id, req.userId, { name: name.trim() });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    return res.json(course);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update course' });
  }
}

async function deleteHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deleted = await coursesRepository.delete(id, req.userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Course not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete course' });
  }
}

async function listSessions(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const course = await coursesRepository.findByIdAndUser(id, req.userId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const sessions = await sessionsRepository.findByCourse(id);
    return res.json(sessions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to list sessions' });
  }
}

module.exports = {
  create,
  list,
  get,
  update,
  delete: deleteHandler,
  listSessions,
};
