const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Message = sequelize.define(
  "Message",
  {
    message_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    receiver_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    auction_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "auctions",
        key: "auction_id",
      },
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

module.exports = Message;