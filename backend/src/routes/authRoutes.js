const express = require('express');
const {
  sendVerificationCode,
  verifyEmailCode,
  registerUser,
  loginUser,
} = require('../controllers/authController');

const router = express.Router();

// Email verification routes
router.post('/send-verification', sendVerificationCode);
router.post('/verify-email', verifyEmailCode);

// User authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;
