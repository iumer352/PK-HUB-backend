
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StageLookup = sequelize.define('StageLookup', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'stage_lookups',
  timestamps: true,
  underscored: true
});

module.exports = StageLookup;