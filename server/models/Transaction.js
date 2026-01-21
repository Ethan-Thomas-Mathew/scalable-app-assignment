const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
    coinName: { type: DataTypes.STRING, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    priceAtBuy: { type: DataTypes.FLOAT, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.STRING, allowNull: true }
});

User.hasMany(Transaction);
Transaction.belongsTo(User);

module.exports = Transaction;