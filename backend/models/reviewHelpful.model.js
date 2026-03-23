const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

// Tracks which user marked which review as helpful
// Prevents the same user from voting twice on the same review
const ReviewHelpful = sequelize.define(
  "ReviewHelpful",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "reviews", key: "review_id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "user_id" },
    },
  },
  {
    tableName: "review_helpfuls",
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ["review_id", "user_id"], // one vote per user per review
      },
    ],
  }
);

module.exports = ReviewHelpful;