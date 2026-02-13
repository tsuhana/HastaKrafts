const { Sequelize } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");
const User = require("./user.model");
const Seller = require("./seller.model");
const PasswordReset = require("./passwordReset.model");
const Category = require("./category.model");
const Product = require("./product.model");
const Cart = require("./cart.model");           
const CartItem = require("./cartItem.model");   

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.User = User;
db.Seller = Seller;
db.PasswordReset = PasswordReset;
db.Category = Category;
db.Product = Product;
db.Cart = Cart;           
db.CartItem = CartItem;   

// ========== ASSOCIATIONS ==========

// User <-> Seller (One-to-One)
User.hasOne(Seller, { foreignKey: "user_id", as: "sellerProfile" });
Seller.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> PasswordReset (One-to-Many)
User.hasMany(PasswordReset, { foreignKey: "user_id" });
PasswordReset.belongsTo(User, { foreignKey: "user_id" });

// Seller <-> Product (One-to-Many)
Seller.hasMany(Product, { foreignKey: "seller_id", as: "products" });
Product.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

// Category <-> Product (One-to-Many)
Category.hasMany(Product, { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// User <-> Product Approval (One-to-Many)
User.hasMany(Product, { foreignKey: "approved_by", as: "approvedProducts" });
Product.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

// CART ASSOCIATIONS
// User <-> Cart (One-to-One)
User.hasOne(Cart, { foreignKey: "user_id", as: "cart" });
Cart.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Cart <-> CartItem (One-to-Many)
Cart.hasMany(CartItem, { foreignKey: "cart_id", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cart_id", as: "cart" });

// Product <-> CartItem (One-to-Many)
Product.hasMany(CartItem, { foreignKey: "product_id", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

module.exports = db;