const express = require('express');
const router = express.Router();
const roleAuth = require('../middleware/roleAuth');
const authController = require('../controllers/authController');
const AppError = require('../utils/appError');

// Protect all routes after this middleware
router.use(authController.protect);

// Route accessible only to HR and admin
router.get('/sensitive-data', 
  roleAuth(['hr', 'admin']), 
  (req, res) => {
    try {
      // Your route handler code
      res.status(200).json({
        status: 'success',
        data: {
          // your data
        }
      });
    } catch (error) {
      next(new AppError('Error fetching sensitive data', 500));
    }
});

// Route accessible only to admin
router.post('/admin-only', 
  roleAuth(['admin']), 
  (req, res) => {
    try {
      // Your route handler code
      res.status(200).json({
        status: 'success',
        data: {
          // your data
        }
      });
    } catch (error) {
      next(new AppError('Error processing admin request', 500));
    }
});

// Route accessible to all authenticated users
router.get('/public-data', 
  (req, res) => {
    // Your route handler code
});

module.exports = router; 