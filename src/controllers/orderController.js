const Order = require('../models/Order');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../utils/constants');
const { sendConfirmationEmail } = require('../services/emailService');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.checkout = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId')
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Validate stock and reserve
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId._id).session(session);

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product ${item.productId.name} not found`
        });
      }

      if (product.availableStock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      // Reserve stock
      product.availableStock -= item.quantity;
      product.reservedStock += item.quantity;
      await product.save({ session });

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtPurchase: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Set expiry time (15 minutes from now)
    const expiryMinutes = parseInt(process.env.ORDER_EXPIRY_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Create order
    const order = await Order.create([{
      userId: req.user.userId,
      items: orderItems,
      totalAmount,
      status: ORDER_STATUS.PENDING_PAYMENT,
      expiresAt
    }], { session });

    // Clear cart
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    // Schedule order expiry check
    setTimeout(async () => {
      await checkAndExpireOrder(order[0]._id);
    }, expiryMinutes * 60 * 1000);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: order[0],
        expiresAt
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.payOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      userId: req.user.userId
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order cannot be paid. Current status: ${order.status}`
      });
    }

    if (new Date() > order.expiresAt) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Order has expired'
      });
    }

    // Simulate payment processing
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = await Payment.create([{
      orderId: order._id,
      transactionId,
      amount: order.totalAmount,
      status: PAYMENT_STATUS.SUCCESS
    }], { session });

    // Update order status
    order.status = ORDER_STATUS.PAID;
    await order.save({ session });

    // Finalize stock (clear reserved, already decremented available)
    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      product.reservedStock -= item.quantity;
      await product.save({ session });
    }

    await session.commitTransaction();

    // Queue email (async, non-blocking)
    sendConfirmationEmail(order._id).catch(err => 
      console.error('Email sending failed:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: {
        order,
        payment: payment[0]
      }
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('items.productId', 'name price');

    const total = await Order.countDocuments({ userId: req.user.userId });

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      userId: req.user.userId
    }).populate('items.productId', 'name price description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check and expire orders
async function checkAndExpireOrder(orderId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order || order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      await session.abortTransaction();
      return;
    }

    if (new Date() > order.expiresAt) {
      // Release reserved stock
      for (const item of order.items) {
        const product = await Product.findById(item.productId).session(session);
        if (product) {
          product.availableStock += item.quantity;
          product.reservedStock -= item.quantity;
          await product.save({ session });
        }
      }

      // Cancel order
      order.status = ORDER_STATUS.CANCELLED;
      await order.save({ session });

      await session.commitTransaction();
      console.log(`Order ${orderId} expired and cancelled`);
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Error expiring order:', error);
  } finally {
    session.endSession();
  }
}

