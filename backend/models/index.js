const { Sequelize } = require("sequelize");
const sequelize = require("../config/HastaKrafts_db");
const User = require("./user.model");
const Seller = require("./seller.model");
const PasswordReset = require("./passwordReset.model");
const Category = require("./category.model");
const Product = require("./product.model");
const ProductTranslation = require("./productTranslation.model");
const Cart = require("./cart.model");
const CartItem = require("./cartItem.model");
const Order = require("./order.model");
const OrderItem = require("./orderItem.model");
const Auction = require("./auction.model");
const Bid = require("./bid.model");
const Message = require("./message.model");
const Review = require("./review.model");
const ReviewHelpful = require("./reviewHelpful.model"); 
const Wishlist = require("./wishlist.model");
const Banner = require('./banner.model');
const Contact = require('./contact.model');
const UserPoints = require('./userPoints.model');
const PointTransaction = require('./pointTransaction.model');
const Story = require('./story.model');
const Notification = require('./notification.model');

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.User = User;
db.Seller = Seller;
db.PasswordReset = PasswordReset;
db.Category = Category;
db.Product = Product;
db.ProductTranslation = ProductTranslation;
db.Cart = Cart;
db.CartItem = CartItem;
db.Order = Order;
db.OrderItem = OrderItem;
db.Auction = Auction;
db.Bid = Bid;
db.Message = Message;
db.Review = Review;
db.ReviewHelpful = ReviewHelpful; 
db.Wishlist = Wishlist;
db.Banner = Banner;
db.Contact = Contact;
db.UserPoints = UserPoints;
db.PointTransaction = PointTransaction;
db.Story = Story;
db.Notification = Notification;


// ── User / Seller ─────────────────────────────────────────────
User.hasOne(Seller, { foreignKey: "user_id", as: "sellerProfile" });
Seller.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Password Reset ────────────────────────────────────────────
User.hasMany(PasswordReset, { foreignKey: "user_id" });
PasswordReset.belongsTo(User, { foreignKey: "user_id" });

// ── Product ───────────────────────────────────────────────────
Seller.hasMany(Product, { foreignKey: "seller_id", as: "products" });
Product.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

Category.hasMany(Product, { foreignKey: "category_id", as: "products" });
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" });

//  Renamed alias from "translations" to "productTranslations" to avoid
// collision with the existing JSONB "translations" column on Product model
Product.hasMany(ProductTranslation, { foreignKey: "product_id", as: "productTranslations" });
ProductTranslation.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(Product, { foreignKey: "approved_by", as: "approvedProducts" });
Product.belongsTo(User, { foreignKey: "approved_by", as: "approver" });

// ── Cart ──────────────────────────────────────────────────────
User.hasOne(Cart, { foreignKey: "user_id", as: "cart" });
Cart.belongsTo(User, { foreignKey: "user_id", as: "user" });

Cart.hasMany(CartItem, { foreignKey: "cart_id", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cart_id", as: "cart" });

Product.hasMany(CartItem, { foreignKey: "product_id", as: "cartItems" });
CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// ── Order ─────────────────────────────────────────────────────
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });

Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Product.hasMany(OrderItem, { foreignKey: "product_id", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Seller.hasMany(OrderItem, { foreignKey: "seller_id", as: "orderItems" });
OrderItem.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

// ── Auction / Bid ─────────────────────────────────────────────
Seller.hasMany(Auction, { foreignKey: "seller_id", as: "auctions" });
Auction.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

Product.hasMany(Auction, { foreignKey: "product_id", as: "auctions" });
Auction.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(Auction, { foreignKey: "winner_id", as: "wonAuctions" });
Auction.belongsTo(User, { foreignKey: "winner_id", as: "winner" });

Auction.hasMany(Bid, { foreignKey: "auction_id", as: "bids" });
Bid.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });

User.hasMany(Bid, { foreignKey: "user_id", as: "bids" });
Bid.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Message ───────────────────────────────────────────────────
User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });

Auction.hasMany(Message, { foreignKey: "auction_id", as: "messages" });
Message.belongsTo(Auction, { foreignKey: "auction_id", as: "auction" });

// ── Review + Nested Replies + Helpful ────────────────────────
Product.hasMany(Review, { foreignKey: "product_id", as: "reviews" });
Review.belongsTo(Product, { foreignKey: "product_id", as: "product" });

User.hasMany(Review, { foreignKey: "user_id", as: "reviews" });
Review.belongsTo(User, { foreignKey: "user_id", as: "user" });

Order.hasMany(Review, { foreignKey: "order_id", as: "reviews" });
Review.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// nested replies (self-referential)
Review.hasMany(Review, { foreignKey: "parent_id", as: "replies" });
Review.belongsTo(Review, { foreignKey: "parent_id", as: "parent" });

// helpful votes
Review.hasMany(ReviewHelpful, { foreignKey: "review_id", as: "helpfuls" });
ReviewHelpful.belongsTo(Review, { foreignKey: "review_id", as: "review" });

User.hasMany(ReviewHelpful, { foreignKey: "user_id", as: "helpfulVotes" });
ReviewHelpful.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Wishlist ──────────────────────────────────────────────────
User.hasMany(Wishlist, { foreignKey: "user_id", as: "wishlist" });
Wishlist.belongsTo(User, { foreignKey: "user_id", as: "user" });

Product.hasMany(Wishlist, { foreignKey: "product_id", as: "wishlists" });
Wishlist.belongsTo(Product, { foreignKey: "product_id", as: "product" });

// ── Points ────────────────────────────────────────────────────
User.hasOne(UserPoints, { foreignKey: "user_id", as: "points" });
UserPoints.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(PointTransaction, { foreignKey: "user_id", as: "pointTransactions" });
PointTransaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

Order.hasMany(PointTransaction, { foreignKey: "order_id", as: "pointTransactions" });
PointTransaction.belongsTo(Order, { foreignKey: "order_id", as: "order" });

// ── Story ────────────────────────────────────────────────────
Seller.hasMany(Story, { foreignKey: "seller_id", as: "stories" });
Story.belongsTo(Seller, { foreignKey: "seller_id", as: "seller" });

// ── Notifications ─────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = db;