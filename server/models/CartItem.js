const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const CartItem = sequelize.define('CartItem', {
    coinId: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
});

User.hasMany(CartItem);
CartItem.belongsTo(User);

module.exports = CartItem;