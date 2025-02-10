const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// GET /api/employees - Get all employees
router.get('/', employeeController.getEmployees);

// GET /api/employees/:id - Get single employee
router.get('/:id', employeeController.getEmployeeById);

// GET /api/employees/:employeeId/availability - Get employee availability
router.get('/:employeeId/availability', employeeController.getEmployeeAvailability);

// POST /api/employees - Create new employee
router.post('/', employeeController.createEmployee);

// PATCH /api/employees/:id - Update employee
router.patch('/:id', employeeController.updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;