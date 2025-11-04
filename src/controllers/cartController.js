const Cart = require('../models/Cart');
const Product = require('../models/Product');

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId })
      .populate('items.productId', 'name price description availableStock');

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: {
            userId: req.user.userId,
            items: [],
            totalItems: 0,
            totalAmount: 0
          }
        }
      });
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.productId.price * item.quantity);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        cart: {
          ...cart.toObject(),
          totalItems: cart.items.length,
          totalAmount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.availableStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.userId,
        items: [{ productId, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      await cart.save();
    }

    await cart.populate('items.productId', 'name price description');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { cart }
    });
  } catch (error) {
    next(error);
  }
};