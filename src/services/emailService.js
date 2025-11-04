const Queue = require('bull');
const Order = require('../models/Order');

// Create email queue
const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { orderId } = job.data;
  
  try {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .populate('items.productId', 'name');

    if (!order) {
      throw new Error('Order not found');
    }

    // Simulate email sending
    console.log(`
      ====================================
      CONFIRMATION EMAIL
      ====================================
      To: ${order.userId.email}
      Subject: Order Confirmation #${order._id}
      
      Dear ${order.userId.name},
      
      Your order has been confirmed!
      
      Order ID: ${order._id}
      Total Amount: $${order.totalAmount}
      Status: ${order.status}
      
      Items:
      ${order.items.map(item => 
        `- ${item.productId.name} x ${item.quantity} @ $${item.priceAtPurchase}`
      ).join('\n      ')}
      
      Thank you for your purchase!
      ====================================
    `);

    return { success: true, orderId };
  } catch (error) {
    console.error('Email processing error:', error);
    throw error;
  }
});

const sendConfirmationEmail = async (orderId) => {
  try {
    await emailQueue.add(
      { orderId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    );
    console.log(`Email job queued for order ${orderId}`);
  } catch (error) {
    console.error('Failed to queue email:', error);
  }
};

module.exports = { sendConfirmationEmail, emailQueue };

