const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const PasswordReset = sequelize.define(
  "PasswordReset",
  {
    reset_id: {
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
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true, // NOW OPTIONAL
    },
    otp: {
      type: DataTypes.STRING(6), // NEW: 6-digit OTP
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "password_resets",
    timestamps: true,
    underscored: true,
  }
);

module.exports = PasswordReset;