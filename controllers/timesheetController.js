const { Timesheet, Employee, Project } = require('../models/associations');
const { Op } = require('sequelize');
const sequelize = require('../config/database'); // Changed from '../models/db' to '../config/database'

// Get monthly timesheet for an employee
const getMonthlyTimesheet = async (req, res) => {
  try {
    const { employeeId, year, month } = req.params;
    
    const timesheet = await Timesheet.findAll({
      where: {
        employee_id: employeeId,
        year: year,
        month: month
      },
      include: [
        {
          model: Project,
          as: 'project'
        }
      ]
    });
    
    res.json(timesheet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or update timesheet entry
const createOrUpdateEntry = async (req, res) => {
  try {
    const { employee_id, project_id, date, hours } = req.body;
    
    // Extract month and year from date
    const entryDate = new Date(date);
    const month = entryDate.getMonth() + 1;
    const year = entryDate.getFullYear();

    // Check if project exists and is active
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create or update the entry
    const [entry, created] = await Timesheet.upsert({
      employee_id,
      project_id,
      date,
      hours,
      month,
      year
    });

    res.status(created ? 201 : 200).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get monthly utilization for all employees
const getMonthlyUtilization = async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const utilization = await Timesheet.findAll({
      where: {
        year,
        month
      },
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Project,
          as: 'project'
        }
      ],
      group: ['employee_id', 'employee.id'],
      attributes: [
        'employee_id',
        [sequelize.fn('SUM', sequelize.col('hours')), 'total_hours']
      ]
    });
    
    res.json(utilization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get yearly utilization for all employees
const getYearlyUtilization = async (req, res) => {
  try {
    const { year } = req.params;
    
    const utilization = await Timesheet.findAll({
      where: { year },
      include: [
        {
          model: Employee,
          as: 'employee'
        },
        {
          model: Project,
          as: 'project'
        }
      ],
      group: ['employee_id', 'employee.id', 'month'],
      attributes: [
        'employee_id',
        'month',
        [sequelize.fn('SUM', sequelize.col('hours')), 'total_hours']
      ]
    });
    
    res.json(utilization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee's assigned projects
const getEmployeeProjects = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findByPk(employeeId, {
      include: [
        {
          model: Project,
          as: 'projects',
          through: { attributes: [] }
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.json(employee.projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMonthlyTimesheet,
  createOrUpdateEntry,
  getMonthlyUtilization,
  getYearlyUtilization,
  getEmployeeProjects
};
