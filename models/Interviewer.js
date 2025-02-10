const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interviewer = sequelize.define('Interviewer', {
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
  function:{
    type: DataTypes.ENUM('Data Transformation', 'Analytics and AI', 'Low Code', 'Digital Enablement', 'Innovation and Emerging Tech'),
    allowNull: false,
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false // Example: "HR Manager", "Technical Lead", etc.
  },
  interview_type: {
    type: DataTypes.ENUM('HR', 'Technical', 'Cultural', 'Final'),
    allowNull: false
  }
}, {
  tableName: 'interviewers',
  timestamps: true, // Adds createdAt and updatedAt fields
  underscored: true // Use snake_case column names in the database
});

module.exports = Interviewer;
