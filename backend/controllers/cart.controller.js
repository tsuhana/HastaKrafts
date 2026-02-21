const db = require("../models");

// ==================== GET USER CART ====================
const getCart = async (req, res) => {
  try {
    let cart = await db.Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.CartItem,
          as: "items",
          include: [
            {
              model: db.Product,
              as: "product",
              //  has_discount and discount_percentage included
              attributes: ["product_id", "name", "price", "images", "stock_quantity", "has_discount", "discount_percentage"],
              include: [
                {
                  model: db.Seller,
                  as: "seller",
                  attributes: ["shop_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart) {
      cart = await db.Cart.create({
        user_id: req.user.user_id,
      });
      cart.items = [];
    }

    // ✅ Subtotal uses discounted prices
    let subtotal = 0;
    if (cart.items) {
      cart.items.forEach((item) => {
        if (item.product) {
          const hasDiscount = item.product.has_discount === true || item.product.has_discount === 'true';
          const discountPct = parseInt(item.product.discount_percentage) || 0;
          const actualPrice = hasDiscount && discountPct > 0
            ? Math.round(item.product.price * (1 - discountPct / 100))
            : parseFloat(item.product.price);
          subtotal += actualPrice * item.quantity;
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cart,
        subtotal,
        total: subtotal,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

// ==================== ADD TO CART ====================
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const product = await db.Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock_quantity} items available in stock`,
      });
    }

    let cart = await db.Cart.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!cart) {
      cart = await db.Cart.create({
        user_id: req.user.user_id,
      });
    }

    let cartItem = await db.CartItem.findOne({
      where: {
        cart_id: cart.cart_id,
        product_id: product_id,
      },
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;

      if (newQuantity > product.stock_quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${product.stock_quantity} items available`,
        });
      }

      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      cartItem = await db.CartItem.create({
        cart_id: cart.cart_id,
        product_id: product_id,
        quantity: quantity,
      });
    }

    const updatedCart = await db.Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.CartItem,
          as: "items",
          include: [
            {
              model: db.Product,
              as: "product",
              // ✅ has_discount + discount_percentage added
              attributes: ["product_id", "name", "price", "images", "stock_quantity", "has_discount", "discount_percentage"],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: updatedCart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add item to cart",
    });
  }
};

// ==================== UPDATE CART ITEM QUANTITY ====================
const updateCartItem = async (req, res) => {
  try {
    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cartItem = await db.CartItem.findOne({
      where: { cart_item_id },
      include: [
        {
          model: db.Cart,
          as: "cart",
          where: { user_id: req.user.user_id },
        },
        {
          model: db.Product,
          as: "product",
          attributes: ["stock_quantity"],
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    if (quantity > cartItem.product.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${cartItem.product.stock_quantity} items available`,
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: cartItem,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart item",
    });
  }
};

// ==================== REMOVE FROM CART ====================
const removeFromCart = async (req, res) => {
  try {
    const { cart_item_id } = req.params;

    const cartItem = await db.CartItem.findOne({
      where: { cart_item_id },
      include: [
        {
          model: db.Cart,
          as: "cart",
          where: { user_id: req.user.user_id },
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    await cartItem.destroy();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
    });
  }
};

// ==================== CLEAR CART ====================
const clearCart = async (req, res) => {
  try {
    const cart = await db.Cart.findOne({
      where: { user_id: req.user.user_id },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await db.CartItem.destroy({
      where: { cart_id: cart.cart_id },
    });

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};