const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsync = require("../utils/catchAsync");
const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const ApiError = require("../utils/ApiError");
const Order = require("../model/orderModel");
const handleFactory = require("./handlersFactory");
const User = require("../model/userModel");

exports.createCashOrder = catchAsync(async (req, res, next) => {
  const { cartId } = req.params;
  const { shippingAddress } = req.query;
  const shippingPrice = 10;
  // 1) Get cart depend on cartId
  const cart = await Cart.findById(cartId);
  if (!cart) {
    return next(new ApiError(`Can't find this cart with id: ${cartId}`, 404));
  }
  // 2) total order price
  const cartTotalPrice = cart.totalCartPrice;
  const totalOrderPrice = cartTotalPrice + shippingPrice;
  // 3) create new order
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    totalPrice: totalOrderPrice,
  });
  // 4) After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOption, {});
    // 4) delete cart
    await Cart.findByIdAndDelete(cartId);
  }
  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: order,
  });
});

exports.filterOrderForLoggedUser = catchAsync(async (req, res, next) => {
  if (req.user.role === "user") req.filterObj = { user: req.user._id };
  next();
});

exports.getAllOrder = handleFactory.getAll(Order);

exports.getOrder = handleFactory.getOne(Order);

exports.updateOrderToPaid = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(
        `There is no such a order with this id:${req.params.id}`,
        404
      )
    );
  }

  // update order to paid
  order.isPaid = true;
  order.paidAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({ status: "success", data: updatedOrder });
});

exports.updateOrderToDelivered = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(
      new ApiError(
        `There is no such a order with this id:${req.params.id}`,
        404
      )
    );
  }

  // update order to paid
  order.isDelivered = true;
  order.deliveredAt = Date.now();

  const updatedOrder = await order.save();

  res.status(200).json({ status: "success", data: updatedOrder });
});

exports.checkOutSessions = catchAsync(async (req, res, next) => {
  const { cartId } = req.params;
  const { shippingAddress } = req.body;
  const shippingPrice = 10;
  // 1) Get cart depend on cartId
  const cart = await Cart.findById(cartId);
  if (!cart) {
    return next(new ApiError(`Can't find this cart with id: ${cartId}`, 404));
  }
  // 2) total order price
  const cartTotalPrice = cart.totalCartPrice;
  const totalOrderPrice = cartTotalPrice + shippingPrice;
  // 3) Create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/api/v1/orders`,
    cancel_url: `${req.protocol}://${req.get("host")}/cart`,
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: totalOrderPrice,
          product_data: {
            name: "exclusive",
          },
        },
        quantity: 1,
      },
    ],
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: shippingAddress,
    mode: "payment",
  });

  // 4) send session to response
  res.status(200).json({ status: "success", session });
});

const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const oderPrice = session.amount_total;

  const cart = await Cart.findById(cartId);
  const user = await User.findOne({ email: session.customer_email });

  // 3) Create order with default paymentMethodType card
  const order = await Order.create({
    user: user._id,
    cartItems: cart.cartItems,
    shippingAddress,
    totalOrderPrice: oderPrice,
    isPaid: true,
    paidAt: Date.now(),
    paymentMethodType: "card",
  });

  // 4) After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await Product.bulkWrite(bulkOption, {});

    // 5) Clear cart depend on cartId
    await Cart.findByIdAndDelete(cartId);
  }
};

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Protected/User
exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    //  Create order
    createCardOrder(event.data.object);
  }

  res.status(200).json({ received: true });
});
