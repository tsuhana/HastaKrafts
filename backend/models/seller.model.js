const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Seller = sequelize.define(
  "Seller",
  {
    seller_id: {
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
      onDelete: "CASCADE",
    },
    shop_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    shop_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    shop_logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    citizenship_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    citizenship_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_account_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bank_account_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "sellers",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Seller;