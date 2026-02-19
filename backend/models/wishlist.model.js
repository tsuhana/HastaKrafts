const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Wishlist = sequelize.define(
  "Wishlist",
  {
    wishlist_id: {
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "product_id",
      },
    },
  },
  {
    tableName: "wishlists",
    timestamps: true,
    underscored: true,
    updatedAt: false, 
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
      },
    ],
  }
);

module.exports = Wishlist;