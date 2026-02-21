const { DataTypes } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");

const Product = sequelize.define(
  "Product",
  {
    product_id: {
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "category_id",
      },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    views_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  
    // discount related
    has_discount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    discount_percentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: "Discount percentage (0-100)"
    },
    
    // MULTI-LANGUAGE TRANSLATIONS
    translations: {
      type: DataTypes.JSONB,
      defaultValue: {
        en: null, // English (original)
        ne: null, // Nepali
        es: null, // Spanish
        hi: null, // Hindi
        zh: null, // Chinese
        fr: null, // French
        ja: null, // Japanese
        de: null, // German
        ko: null, // Korean
        ar: null, // Arabic
      }
    },
  },
  {
    tableName: "products",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Product;