const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Banner = sequelize.define(
  "Banner",
  {
    banner_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    link_url: {
      type: DataTypes.STRING(500),
      allowNull: true, // Can link to products, categories, or external
    },
    link_type: {
      type: DataTypes.ENUM('product', 'category', 'external', 'none'),
      defaultValue: 'none',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // For ordering banners
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "banners",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Banner;