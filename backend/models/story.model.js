const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Story = sequelize.define(
  "Story",
  {
    story_id: {
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
    title: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(500),
      comment: "Short summary for preview",
    },
    featured_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    category: {
      type: DataTypes.ENUM('craft_process', 'heritage', 'personal_journey', 'tips_tricks', 'behind_scenes', 'other'),
      defaultValue: 'other',
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    published_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "stories",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Story;