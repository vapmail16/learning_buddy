const coursesRepository = require('../repositories/courses.repository');
const sessionsRepository = require('../repositories/sessions.repository');
const notesRepository = require('../repositories/notes.repository');
const uploadsRepository = require('../repositories/uploads.repository');

async function ensureSessionOwnership(userId, sessionId) {
  const session = await sessionsRepository.findById(sessionId);
  if (!session) return false;
  const course = await coursesRepository.findByIdAndUser(session.course_id, userId);
  return course !== null;
}

async function getBySession(req, res) {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }
    const allowed = await ensureSessionOwnership(req.userId, sessionId);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const note = await notesRepository.findBySession(sessionId);
    const uploads = await uploadsRepository.findBySession(sessionId);
    return res.json({ note: note || null, uploads });
  } catch (err) {
    console.error('getBySession error:', err.message);
    return res.status(500).json({ error: 'Failed to get notes' });
  }
}

async function upsert(req, res) {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }
    const allowed = await ensureSessionOwnership(req.userId, sessionId);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const { content, table_data: tableData, highlights, blocks } = req.body;
    const existing = await notesRepository.findBySession(sessionId);
    let result;
    if (existing) {
      result = await notesRepository.update(existing.id, {
        content: content !== undefined ? content : existing.content,
        tableData: tableData !== undefined ? tableData : existing.table_data,
        highlights: highlights !== undefined ? highlights : existing.highlights,
        blocks: blocks !== undefined ? blocks : undefined,
      });
    } else {
      result = await notesRepository.create(sessionId, {
        content: content ?? null,
        tableData: tableData ?? null,
        highlights: highlights ?? null,
        blocks: blocks ?? null,
      });
    }
    return res.json(result);
  } catch (err) {
    console.error('notes upsert error:', err.message);
    return res.status(500).json({ error: 'Failed to save notes' });
  }
}

module.exports = { getBySession, upsert };
