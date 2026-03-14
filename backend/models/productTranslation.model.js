const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const ProductTranslation = sequelize.define(
  "ProductTranslation",
  {
    translation_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "product_id",
      },
    },
    language_code: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "product_translations",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ProductTranslation;