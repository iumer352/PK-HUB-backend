const express = require('express');
const router = express.Router();
const timesheetController = require('../controllers/timesheetController');

// Get employee's timesheet for a specific month
router.get('/:employeeId/:year/:month', timesheetController.getMonthlyTimesheet);

// Create or update timesheet entry
router.post('/entry', timesheetController.createOrUpdateEntry);

// Get monthly utilization report
router.get('/utilization/monthly/:year/:month', timesheetController.getMonthlyUtilization);

// Get yearly utilization report
router.get('/utilization/yearly/:year', timesheetController.getYearlyUtilization);

// Get employee's assigned projects
router.get('/projects/:employeeId', timesheetController.getEmployeeProjects);

module.exports = router;
