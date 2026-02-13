const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/:resource', resourceController.list);
router.post('/:resource', resourceController.create);
router.get('/:resource/:id', resourceController.get);
router.put('/:resource/:id', resourceController.update);
router.delete('/:resource/:id', resourceController.delete);

module.exports = router;
