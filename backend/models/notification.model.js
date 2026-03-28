const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Notification = sequelize.define(
  "Notification",
  {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      // Types: order_placed, order_shipped, order_delivered, order_cancelled,
      // outbid, auction_won, auction_lost, auction_ended, auction_bid,
      // product_approved, product_rejected, new_order, new_review,
      // new_message, review_reply, points_earned, low_stock,
      // new_seller_application, new_product_pending
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true, // extra metadata e.g. { order_id: 5, product_id: 3 }
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Notification;