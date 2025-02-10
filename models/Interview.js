// models/Interview.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interview = sequelize.define('Interview', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applicant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  interviewer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
}, {
  tableName: 'interviews',
  timestamps: true,
  underscored: true
});

module.exports = Interview;