const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectAssignee = sequelize.define('ProjectAssignee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    projectId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Projects',
            key: 'id'
        }
    },
    employeeId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Employees',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    tableName: 'ProjectAssignees'
});

module.exports = ProjectAssignee;