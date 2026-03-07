const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Contact = sequelize.define(
  "Contact",
  {
    contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    subject: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'resolved'),
      defaultValue: 'pending',
    },
    admin_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    replied_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "contacts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Contact;