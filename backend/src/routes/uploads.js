const express = require('express');
const path = require('path');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const uploadsController = require('../controllers/uploads.controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, path.extname(file.originalname)) || 'file';
    const safe = `${Date.now()}-${base.replace(/[^a-zA-Z0-9.-]/g, '_')}${ext}`;
    cb(null, safe);
  },
});
const upload = multer({ storage });

router.use(authMiddleware);

router.get('/:uploadId/file', uploadsController.serveFile);
router.post('/sessions/:sessionId', upload.single('file'), uploadsController.upload);

module.exports = router;
