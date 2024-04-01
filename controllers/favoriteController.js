const Favorite = require("../model/favoriteModel");
const Product = require("../model/productModel");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

exports.addProductToFavorite = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) {
    return next(
      new ApiError(`Can't find this product with id: ${productId}`, 404)
    );
  }
  const { _id: userId } = req.user;
  let favorite = await Favorite.findOne({ user: userId });
  // if no found cart in this user, create new cart to user
  if (!favorite) {
    favorite = await Favorite.create({
      user: userId,
      favoriteItems: [{ product: productId, price: product.price }],
    });
  } else {
    // search for products with products matching
    const favoriteIndex = favorite.favoriteItems.findIndex(
      (item) => item.product.toString() === productId
    );
    // product exist in cart, update product quantity
    if (favoriteIndex === -1) {
      // product not exist in cart,  push product to cartItems array
      favorite.favoriteItems.push({ product: productId, price: product.price });
    } else {
      return next(new ApiError("product already in favorite", 400));
    }
  }
  await favorite.save();
  res.status(200).json({
    message: "Add favorite successfully",
    data: favorite,
  });
});

exports.getLoggedUserFavorite = catchAsync(async (req, res, next) => {
  const { _id: userId } = req.user;
  const favorites = await Favorite.find({ user: userId });
  res.status(200).json({
    status: "success",
    data: favorites,
  });
});

exports.removeProductFromFavorite = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { _id: userId } = req.user;
  const favorite = await Favorite.findOne({ userId, productId });
  if (!favorite) {
    return next(ApiError("Not favorite this product", 400));
  }
  await favorite.remove();
  res.status(200).json({
    message: "Remove favorite successfully",
  });
});

exports.removeSpecificFavoriteItems = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  const { itemId } = req.params;
  const favorite = await Favorite.findOneAndUpdate(
    { user: id },
    {
      $pull: { favoriteItems: { _id: itemId } },
    },
    { new: true }
  );

  favorite.save();

  res.status(200).json({
    status: "success",
    numOfFavoriteItems: favorite.favoriteItems.length,
    data: favorite,
  });
});

exports.clearFavorite = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  let favorite = await Favorite.deleteOne({ user: id });
  if (!favorite) {
    return next(new ApiError(`Can't find this cart with id: ${id}`, 404));
  }

  res.status(204).json({
    status: "success",
    message: "favorite cleared successfully",
  });
});
