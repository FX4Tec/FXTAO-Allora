const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoController');
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', require('../middlewares/authMiddleware'), authController.me);
router.post('/change-password', require('../middlewares/authMiddleware'), authController.changePassword);
router.get('/branding', authController.branding);

// SSO Routes
router.get('/microsoft', ssoController.initiateMicrosoftLogin);
router.get('/microsoft/callback', ssoController.handleMicrosoftCallback);

module.exports = router;
