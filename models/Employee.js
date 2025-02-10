const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.ENUM(
      'Analytics and AI',
      'Data Transformation',
      'Low Code',
      'Digital Enablement',
      'Innovation and Emerging Tech'
    ),
    allowNull: false
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.ENUM(
      'Analyst',
      'Associate',
      'Senior Associate',
      'Assistant Manager',
      'Manager',
      'Manager-1',
      'Senior Manager',
      'Director'
    ),
    allowNull: false
  },
  joinDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = Employee;