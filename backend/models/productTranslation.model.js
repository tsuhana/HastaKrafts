const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const ProductTranslation = sequelize.define(
  "ProductTranslation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    language_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "product_translations",
    timestamps: false,
  }
);

module.exports = ProductTranslation;