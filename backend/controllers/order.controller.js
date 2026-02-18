const db = require("../models");
const axios = require("axios");

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// ==================== INITIATE KHALTI PAYMENT (HELPER) ====================
const initiateKhaltiPayment = async (order) => {
  const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  if (!KHALTI_SECRET_KEY) {
    throw new Error("KHALTI_SECRET_KEY missing in backend .env");
  }

  // Khalti will redirect to this URL after payment
  const returnUrl = `${FRONTEND_URL}/payment/khalti/callback?order_id=${order.order_id}`;

  const payload = {
    return_url: returnUrl,
    website_url: FRONTEND_URL,
    amount: Math.round(Number(order.total) * 100), // paisa
    purchase_order_id: order.order_number,
    purchase_order_name: `Order ${order.order_number}`,
    customer_info: {
      name: order.delivery_name,
      email: order.delivery_email,
      phone: order.delivery_phone,
    },
  };

  const response = await axios.post(
    "https://a.khalti.com/api/v2/epayment/initiate/",
    payload,
    {
      headers: {
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Save pidx etc
  await order.update({
    payment_data: response.data,
    transaction_id: response.data.pidx || null,
  });

  return response.data.payment_url;
};

// ==================== CREATE ORDER ====================
const createOrder = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      delivery_name,
      delivery_phone,
      delivery_email,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_postal_code,
      delivery_landmark,
      payment_method,
      order_notes,
    } = req.body;

    if (!["khalti", "cod"].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Choose 'khalti' or 'cod'",
      });
    }

    if (!delivery_name || !delivery_phone || !delivery_address || !delivery_city) {
      return res.status(400).json({
        success: false,
        message: "Please provide all delivery information",
      });
    }

    const cart = await db.Cart.findOne({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.CartItem,
          as: "items",
          include: [
            {
              model: db.Product,
              as: "product",
              include: [
                {
                  model: db.Seller,
                  as: "seller",
                  attributes: ["seller_id"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      if (!item.product) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: "Product not found" });
      }

      if (item.quantity > item.product.stock_quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}. Only ${item.product.stock_quantity} available.`,
        });
      }

      const itemSubtotal = item.product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        product_id: item.product.product_id,
        seller_id: item.product.seller.seller_id,
        product_name: item.product.name,
        product_price: item.product.price,
        product_image: item.product.images?.[0] || null,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    const delivery_fee = 150;
    const total = subtotal + delivery_fee;
    const order_number = generateOrderNumber();

    const order = await db.Order.create(
      {
        user_id: req.user.user_id,
        order_number,
        delivery_name,
        delivery_phone,
        delivery_email: delivery_email || req.user.email,
        delivery_address,
        delivery_city,
        delivery_state,
        delivery_postal_code,
        delivery_landmark,
        payment_method,
        payment_status: "pending",
        subtotal,
        delivery_fee,
        total,
        order_status: "pending",
        order_notes,
      },
      { transaction }
    );

    await Promise.all(
      orderItemsData.map((itemData) =>
        db.OrderItem.create(
          {
            order_id: order.order_id,
            ...itemData,
          },
          { transaction }
        )
      )
    );

    for (const item of cart.items) {
      await item.product.update(
        { stock_quantity: item.product.stock_quantity - item.quantity },
        { transaction }
      );
    }

    await db.CartItem.destroy({
      where: { cart_id: cart.cart_id },
      transaction,
    });

    await transaction.commit();

    if (payment_method === "khalti") {
      const paymentUrl = await initiateKhaltiPayment(order);
      return res.status(201).json({
        success: true,
        message: "Order created. Proceed to payment.",
        data: {
          order_id: order.order_id,
          order_number: order.order_number,
          total: order.total,
          payment_method: "khalti",
          payment_url: paymentUrl,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        order_id: order.order_id,
        order_number: order.order_number,
        total: order.total,
        payment_method: "cod",
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

// ==================== VERIFY KHALTI PAYMENT ====================
const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, order_id } = req.query;

    if (!pidx || !order_id) {
      return res.status(400).json({
        success: false,
        message: "Missing pidx or order_id",
      });
    }

    const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;
    if (!KHALTI_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "KHALTI_SECRET_KEY missing in backend .env",
      });
    }

    const lookupRes = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const status = lookupRes.data.status;

    const order = await db.Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (status === "Completed") {
      await order.update({
        payment_status: "paid",
        order_status: "processing",
        transaction_id: lookupRes.data.transaction_id || pidx,
        paid_at: new Date(),
        payment_data: lookupRes.data,
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        data: { order_id: order.order_id, order_number: order.order_number },
      });
    }

    await order.update({
      payment_status: status === "Pending" ? "pending" : "failed",
      payment_data: lookupRes.data,
    });

    return res.status(400).json({
      success: false,
      message: `Payment not completed. Status: ${status}`,
      data: lookupRes.data,
    });
  } catch (error) {
    console.error("Khalti verification error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// ==================== GET USER ORDERS ====================
const getUserOrders = async (req, res) => {
  try {
    const orders = await db.Order.findAll({
      where: { user_id: req.user.user_id },
      include: [
        {
          model: db.OrderItem,
          as: "items",
          include: [{ model: db.Product, as: "product", attributes: ["product_id", "name", "images"] }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Get user orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ==================== GET ORDER BY ID ====================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await db.Order.findOne({
      where: { order_id: id, user_id: req.user.user_id },
      include: [
        {
          model: db.OrderItem,
          as: "items",
          include: [{ model: db.Product, as: "product", attributes: ["product_id", "name", "images"] }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// ==================== GET SELLER ORDERS ====================
const getSellerOrders = async (req, res) => {
  try {
    const seller = await db.Seller.findOne({ where: { user_id: req.user.user_id } });
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    const orderItems = await db.OrderItem.findAll({
      where: { seller_id: seller.seller_id },
      include: [
        { model: db.Order, as: "order", include: [{ model: db.User, as: "user", attributes: ["full_name", "email", "phone"] }] },
        { model: db.Product, as: "product", attributes: ["product_id", "name", "images"] },
      ],
      order: [["created_at", "DESC"]],
    });

    const totalSales = orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);

    const stats = {
      total_orders: orderItems.length,
      total_sales: totalSales,
      pending: orderItems.filter((i) => i.order.order_status === "pending").length,
      processing: orderItems.filter((i) => i.order.order_status === "processing").length,
      shipped: orderItems.filter((i) => i.order.order_status === "shipped").length,
      delivered: orderItems.filter((i) => i.order.order_status === "delivered").length,
    };

    return res.status(200).json({ success: true, data: { orders: orderItems, stats } });
  } catch (error) {
    console.error("Get seller orders error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { order_status } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(order_status)) {
      return res.status(400).json({ success: false, message: "Invalid order status" });
    }

    const order = await db.Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const updateData = { order_status };

    if (order_status === "shipped" && !order.shipped_at) updateData.shipped_at = new Date();
    if (order_status === "delivered" && !order.delivered_at) updateData.delivered_at = new Date();

    //mark COD as paid when delivered
    if (order_status === "delivered" && order.payment_method === "cod") {
      updateData.payment_status = "paid";
      updateData.paid_at = new Date();
    }

    await order.update(updateData);

    return res.status(200).json({ success: true, message: "Order status updated successfully", data: order });
  } catch (error) {
    console.error("Update order status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update order status" });
  }
};

module.exports = {
  createOrder,
  verifyKhaltiPayment,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
};
