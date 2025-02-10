const Employee = require('../models/Employee');
const Project = require('../models/Project');
const { Op } = require('sequelize');

// Get employee availability for a date range
exports.getEmployeeAvailability = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Get employee with projects that overlap with the date range
    const employee = await Employee.findByPk(employeeId, {
      include: [{
        model: Project,
        as: 'projects',
        where: {
          [Op.or]: [
            // Project starts within range
            { startDate: { [Op.between]: [start, end] } },
            // Project ends within range
            { deadline: { [Op.between]: [start, end] } },
            // Project spans the entire range
            {
              [Op.and]: [
                { startDate: { [Op.lte]: start } },
                { deadline: { [Op.gte]: end } }
              ]
            }
          ]
        },
        through: { attributes: [] }  // Don't include junction table fields
      }]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create an array of dates and their availability
    const availability = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const busyProjects = employee.projects.filter(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.deadline);
        return currentDate >= projectStart && currentDate <= projectEnd;
      });

      availability.push({
        date: dateStr,
        isAvailable: busyProjects.length === 0,
        projects: busyProjects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status
        }))
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.status(200).json({
      employeeId: employee.id,
      name: employee.name,
      department: employee.department,
      role: employee.role,
      availability
    });

  } catch (error) {
    console.error('Error checking employee availability:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all employees with their current projects
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [{
        model: Project,
        as: 'projects',
        where: {
          status: { [Op.ne]: 'Completed' },  // Only include active projects
          deadline: { [Op.gte]: new Date() }  // Only include non-expired projects
        },
        required: false,  // LEFT JOIN to show employees even without active projects
        through: { attributes: [] }
      }]
    });
    
    const transformedEmployees = employees.map(emp => {
      const plainEmp = emp.get({ plain: true });
      return {
        ...plainEmp,
        _id: plainEmp.id,
        projects: (plainEmp.projects || []).map(project => ({
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.deadline,
          status: project.status
        }))
      };
    });
    
    res.status(200).json(transformedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new employee from applicant
exports.createEmployee = async (req, res) => {
  try {
    const { name, department, email, phone, jobTitle, grade } = req.body;

    // Create new employee with additional fields
    const employee = await Employee.create({
      name,
      department,
      jobTitle,
      grade,
      email,
      phone,
      joinDate: new Date(), // Set join date to current date
    });

    // Return the created employee with all fields
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [{
        model: Project,
        as: 'projects',
        through: { attributes: [] }
      }]
    });

    res.status(201).json(createdEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Error creating employee', error: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [updatedRowsCount, [updatedEmployee]] = await Employee.update(req.body, {
      where: { id },
      returning: true
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRowsCount = await Employee.destroy({ where: { id } });

    if (deletedRowsCount === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    // Your existing stats code
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};