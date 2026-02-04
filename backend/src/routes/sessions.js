const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const sessionsController = require('../controllers/sessions.controller');

router.use(authMiddleware);

router.post('/', sessionsController.create);
router.get('/:id', sessionsController.get);
router.patch('/:id', sessionsController.update);
router.delete('/:id', sessionsController.delete);

module.exports = router;
