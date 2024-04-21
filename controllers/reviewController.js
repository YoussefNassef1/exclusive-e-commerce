const Review = require("../model/reviewModel");
const handlersFactory = require("./handlersFactory");
const catchAsync = require("../utils/catchAsync");

// Nested route
// GET /api/v1/products/:productId/reviews
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.productId) filterObject = { product: req.params.productId };
  req.filterObj = filterObject;
  next();
};

// Nested route (Create)
exports.setProductIdAndUserIdToBody = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createReview = handlersFactory.createOne(Review);

exports.getAllReviewsSpecificProduct = catchAsync(async (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;

  const reviews = await Review.find({ product: req.body.product });

  res.status(200).json({
    message: "Reviews fetched successfully",
    data: reviews,
  });
});

exports.getReview = handlersFactory.getOne(Review);

exports.updateSpecificReview = handlersFactory.updateOne(Review);

exports.deleteSpecificReview = handlersFactory.deleteOne(Review);

exports.getAllReviews = handlersFactory.getAll(Review);
