const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Job = sequelize.define('Job', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    grade: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: {
                args: [['Analyst', 'Associate', 'Senior Associate', 'Assistant Manager', 'Manager', 'Manager-1', 'Senior Manager', 'Director']],
                msg: 'Invalid grade value'
            }
        }
    },
    hiringManager: {
        type: DataTypes.STRING,
        allowNull: false
    },
    hiringUrgency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Normal',
        validate: {
            isIn: {
                args: [['Urgent - Immediate Hire', 'High Priority', 'Normal', 'Low Priority']],
                msg: 'Invalid hiring urgency value'
            }
        }
    },
    roleOverview: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    keyResponsibilities: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    keySkillsAndCompetencies: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    functionType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Data Transformation',
        validate: {
            isIn: {
                args: [['Data Transformation', 'Analytics and AI', 'Low Code', 'Digital Enablement', 'Innovation and Emerging Tech']],
                msg: 'Invalid function type value'
            }
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Active',
        validate: {
            isIn: {
                args: [['Active', 'Paused', 'Closed']],
                msg: 'Status must be either Active, Paused, or Closed'
            }
        }
    }
}, {
    tableName: 'jobs',
    underscored: true,
    timestamps: true
});

module.exports = Job;