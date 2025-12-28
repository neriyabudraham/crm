const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// לוג בדיקה לטרמינל
console.log('Auth Controller Keys:', Object.keys(authController));

router.get('/users', authController.getUsersList);
router.post('/login', authController.login);

module.exports = router;
