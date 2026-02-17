const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Bid = sequelize.define(
  "Bid",
  {
    bid_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    auction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "auctions",
        key: "auction_id",
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    bid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    bid_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    is_highest: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "bids",
    timestamps: true,
    underscored: true,
    updatedAt: false,
  }
);

module.exports = Bid;