const path = require('path');
const fs = require('fs');
const coursesRepository = require('../repositories/courses.repository');
const sessionsRepository = require('../repositories/sessions.repository');
const uploadsRepository = require('../repositories/uploads.repository');
const notesRepository = require('../repositories/notes.repository');
const { extractFromFile } = require('../services/extraction.service');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

async function ensureSessionOwnership(userId, sessionId) {
  const session = await sessionsRepository.findById(sessionId);
  if (!session) return false;
  const course = await coursesRepository.findByIdAndUser(session.course_id, userId);
  return course !== null;
}

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

async function upload(req, res) {
  try {
    ensureUploadDir();
    const sessionId = parseInt(req.params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }
    const allowed = await ensureSessionOwnership(req.userId, sessionId);
    if (!allowed) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const relativePath = path.join('uploads', req.file.filename);
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype === 'application/pdf' ? 'pdf' : req.file.mimetype;
    const record = await uploadsRepository.create({
      sessionId,
      filePath: relativePath,
      originalFilename: req.file.originalname,
      fileType,
    });
    let notesUpdated = false;
    const isImage = (req.file.mimetype || '').startsWith('image/');
    const isPdf = (req.file.mimetype || '').toLowerCase() === 'application/pdf';
    if ((isImage || isPdf) && req.file.path) {
      const extracted = await extractFromFile(
        req.file.path,
        req.file.mimetype,
        req.file.originalname
      );
      const hasContent = extracted && (
        (extracted.content && extracted.content.trim()) ||
        (extracted.table_data && extracted.table_data.length) ||
        (extracted.highlights && extracted.highlights.length)
      );
      if (hasContent) {
        const existing = await notesRepository.findBySession(sessionId);
        const content = [existing?.content, extracted.content].filter(Boolean).join('\n\n');
        const tableData = [...(existing?.table_data || []), ...(extracted.table_data || [])];
        const highlights = [...(existing?.highlights || []), ...(extracted.highlights || [])];
        if (existing) {
          await notesRepository.update(existing.id, { content, tableData, highlights });
        } else {
          await notesRepository.create(sessionId, { content, tableData, highlights });
        }
        notesUpdated = true;
      }
    }
    return res.status(201).json({ ...record, notesUpdated });
  } catch (err) {
    const message = err.code === '23505' ? 'Duplicate key (run fix-sequences-after-migrate.js on the DB).' : (err.message || 'Upload failed');
    return res.status(err.code === '23505' ? 409 : 500).json({ error: message });
  }
}

async function serveFile(req, res) {
  try {
    const uploadId = parseInt(req.params.uploadId, 10);
    if (Number.isNaN(uploadId)) {
      return res.status(400).json({ error: 'Invalid upload id' });
    }
    const upload = await uploadsRepository.findById(uploadId);
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    const allowed = await ensureSessionOwnership(req.userId, upload.session_id);
    if (!allowed) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    // Use same base dir as upload; file_path is e.g. "uploads/123-foo.jpg"
    const filename = path.basename(upload.file_path);
    if (!filename || filename.includes('..')) {
      return res.status(403).json({ error: 'Invalid path' });
    }
    const absolutePath = path.resolve(uploadDir, filename);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(absolutePath, { headers: { 'Content-Disposition': 'inline' } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to serve file' });
  }
}

module.exports = { upload, serveFile };
