const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const coursesController = require('../controllers/courses.controller');

router.use(authMiddleware);

router.post('/', coursesController.create);
router.get('/', coursesController.list);
router.get('/:id/sessions', coursesController.listSessions);
router.get('/:id', coursesController.get);
router.patch('/:id', coursesController.update);
router.delete('/:id', coursesController.delete);

module.exports = router;
