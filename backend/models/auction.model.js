const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Auction = sequelize.define(
  "Auction",
  {
    auction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "sellers",
        key: "seller_id",
      },
    },
    product_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "products",
        key: "product_id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    images: {
      type: DataTypes.JSONB,
    },
    starting_bid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    current_bid: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    minimum_increment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 100,
    },
    auction_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    auction_end: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'upcoming',
    },
    winner_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    total_bids: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "auctions",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Auction;