const { Sequelize } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");
const User = require("./user.model");
const Seller = require("./seller.model");
const PasswordReset = require("./passwordReset.model");
const Category = require("./category.model");
const Product = require("./product.model");
const Cart = require("./cart.model");
const CartItem = require("./cartItem.model");
const Order = require("./order.model");
const OrderItem = require("./orderItem.model");
const Auction = require("./auction.model");
const Bid = require("./bid.model");
const Message = require("./message.model");

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
db.Order = Order;
db.OrderItem = OrderItem;
db.Auction = Auction;
db.Bid = Bid;
db.Message = Message;

//Relationships

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

// ORDER ASSOCIATIONS
// User <-> Order (One-to-Many)
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Order <-> OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// Product <-> OrderItem (One-to-Many)
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// Seller <-> OrderItem (One-to-Many)
Seller.hasMany(OrderItem, { foreignKey: "seller_id", as: "orderItems" });
OrderItem.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" }); 

// AUCTION ASSOCIATIONS
Seller.hasMany(Auction, { foreignKey: "seller_id", as: "auctions" });
Auction.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

Product.hasMany(Auction, { foreignKey: "product_id", as: "auctions" });
Auction.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(Auction, { foreignKey: "winner_id", as: "wonAuctions" });
Auction.belongsTo(User, { foreignKey: "winner_id", as: "winner" });

// BID ASSOCIATIONS
Auction.hasMany(Bid, { foreignKey: "auction_id", as: "bids" });
Bid.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });

User.hasMany(Bid, { foreignKey: "user_id", as: "bids" });
Bid.belongsTo(User, { foreignKey: "user_id", as: "user" });

// MESSAGE ASSOCIATIONS
User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });

Auction.hasMany(Message, { foreignKey: "auction_id", as: "messages" });
Message.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });

module.exports = db;