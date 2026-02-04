const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const notesController = require('../controllers/notes.controller');

router.use(authMiddleware);

router.get('/sessions/:sessionId', notesController.getBySession);
router.put('/sessions/:sessionId', notesController.upsert);

module.exports = router;
