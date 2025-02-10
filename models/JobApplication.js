const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobApplication = sequelize.define('JobApplication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    applicant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Applicant',
            key: 'id'
        }
    },
    job_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Job',
            key: 'id'
        }
    },
});

module.exports = JobApplication;