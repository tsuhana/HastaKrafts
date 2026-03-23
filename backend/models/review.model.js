const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Review = sequelize.define(
  "Review",
  {
    review_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "product_id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "user_id" },
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "orders", key: "order_id" },
    },
    // for nested replies — null means it's a top-level review
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "reviews", key: "review_id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true, // replies don't need a rating
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    verified_purchase: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    //  helpful thumbs-up count
    helpful_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "reviews",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Review;