const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const ApiError = require("../utils/ApiError");
const calcTotalCartPrice = require("../utils/calcTotalCartPrice");
const catchAsync = require("../utils/catchAsync");

exports.addProductCart = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return next(
      new ApiError(`Can't find this product with id: ${productId}`, 404)
    );
  }
  const { _id: id } = req.user;
  let cart = await Cart.findOne({ user: id });
  // if no found cart in this user, create new cart to user
  if (!cart) {
    cart = await Cart.create({
      user: id,
      cartItems: [{ product: productId, price: product.price }],
    });
  } else {
    // search for products with products matching
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );
    // product exist in cart, update product quantity
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += 1;
    } else {
      // product not exist in cart,  push product to cartItems array
      cart.cartItems.push({ product: productId, price: product.price });
    }
  }

  // update total price
  calcTotalCartPrice(cart);
  await cart.save();

  res.status(200).json({
    status: "success",
    message: "Product added to cart successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// Get cart information in this user's
exports.getLoggedUserCart = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  const cart = await Cart.findOne({ user: id });
  if (!cart) {
    return next(new ApiError(`Can't find this cart with id: ${id}`, 404));
  }
  res.status(200).json({
    status: "success",
    message: "Cart retrieved successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

//update cart items by quantity number
exports.updateCartItemQuantity = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const { _id: id } = req.user;
  let cart = await Cart.findOne({ user: id });
  if (!cart) {
    return next(new ApiError(`Can't find this cart with id: ${id}`, 404));
  }
  const productIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === itemId
  );

  if (productIndex > -1) {
    const cartItem = cart.cartItems[productIndex];
    cartItem.quantity = quantity;
  } else {
    return next(new ApiError(`there is no item for this id :${itemId}`, 404));
  }

  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: "success",
    message: "Product quantity updated successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// remove Specific product
exports.removeSpecificCartItem = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  const { itemId } = req.params;
  const cart = await Cart.findOneAndUpdate(
    { user: id },
    {
      $pull: { cartItems: { _id: itemId } },
    },
    { new: true }
  );

  calcTotalCartPrice(cart);
  cart.save();

  res.status(200).json({
    status: "success",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// clear all cart items
exports.clearCart = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  let cart = await Cart.findByIdAndDelete({ user: id });
  if (!cart) {
    return next(new ApiError(`Can't find this cart with id: ${id}`, 404));
  }

  res.status(204).json({
    status: "success",
    message: "Cart cleared successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
