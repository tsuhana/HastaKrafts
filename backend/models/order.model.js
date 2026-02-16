const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Order = sequelize.define(
  "Order",
  {
    order_id: {
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
    order_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    
    // Delivery Info
    delivery_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    delivery_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    delivery_email: {
      type: DataTypes.STRING(100),
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    delivery_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    delivery_state: {
      type: DataTypes.STRING(100),
    },
    delivery_postal_code: {
      type: DataTypes.STRING(20),
    },
    delivery_landmark: {
      type: DataTypes.STRING(255),
    },
    
    // Payment Info
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING(50),
      defaultValue: "pending",
    },
    
    // Order Info
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    
    // Status
    order_status: {
      type: DataTypes.STRING(50),
      defaultValue: "pending",
    },
    
    // Payment Gateway Data
    transaction_id: {
      type: DataTypes.STRING(255),
    },
    payment_data: {
      type: DataTypes.JSONB,
    },
    
    // Timestamps
    paid_at: {
      type: DataTypes.DATE,
    },
    shipped_at: {
      type: DataTypes.DATE,
    },
    delivered_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Order;