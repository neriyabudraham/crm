const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/users', authController.getUsersList);
router.post('/login', authController.login);
router.post('/users', authController.createUser);
router.patch('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

module.exports = router;
