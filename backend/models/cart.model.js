const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Cart = sequelize.define(
  "Cart",
  {
    cart_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "user_id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "carts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Cart;