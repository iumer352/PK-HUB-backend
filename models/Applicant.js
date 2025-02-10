const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Job = require('./Job');

const Applicant = sequelize.define('Applicant', {
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
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resume: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'applied'
  },
  offer_status: {
    type: DataTypes.ENUM('pending','accepted', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
  },
  ai_result: {
    type: DataTypes.ENUM('shortlisted', 'rejected'),
    allowNull: true
  }
}, {
  tableName: 'applicants',
  underscored: true,
  timestamps: true
});

// Define relationships
Applicant.belongsTo(Job);
Job.hasMany(Applicant);

module.exports = Applicant;