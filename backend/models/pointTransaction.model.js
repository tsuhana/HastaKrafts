const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const PointTransaction = sequelize.define(
  "PointTransaction",
  {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "orders",
        key: "order_id",
      },
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Positive = earned, Negative = redeemed",
    },
    type: {
      type: DataTypes.ENUM("earned", "redeemed", "expired"),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "point_transactions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = PointTransaction;