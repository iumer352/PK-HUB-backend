const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const roleAuth = require('../middleware/roleAuth');
const { validateRegister } = require('../middleware/validateRequest');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Protected routes
router.use(authController.protect); // Middleware to protect all routes below

// User routes (protected)
router.get('/me', authController.getMe);
router.patch('/updatePassword', authController.updatePassword);

// Admin only routes
router.use(roleAuth(['admin']));
router.patch('/updateUserRole', authController.updateUserRole);
router.get('/users', authController.getAllUsers);

module.exports = router; 