const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const UserPoints = sequelize.define(
  "UserPoints",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    total_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lifetime_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    lifetime_redeemed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    tableName: "user_points",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UserPoints;