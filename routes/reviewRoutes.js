const express = require("express");

const router = express.Router({ mergeParams: true });

const authController = require("../controllers/authController");
const {
  createReview,
  getAllReviewsSpecificProduct,
  setProductIdAndUserIdToBody,
  createFilterObj,
  updateSpecificReview,
  deleteSpecificReview,
} = require("../controllers/reviewController");
const {
  deleteReviewValidator,
  createReviewValidator,
  updateReviewValidator,
} = require("../utils/Validators/reviewValidator");

// nested routes
router
  .route("/")
  .get(getAllReviewsSpecificProduct)
  .post(
    authController.protect,
    authController.allowedTo("user", "admin"),
    createFilterObj,
    setProductIdAndUserIdToBody,
    createReviewValidator,
    createReview
  );

router
  .route("/:id")
  .put(
    authController.protect,
    authController.allowedTo("user", "admin"),
    updateReviewValidator,
    updateSpecificReview
  )
  .delete(
    authController.protect,
    authController.allowedTo("user", "admin"),
    deleteReviewValidator,
    deleteSpecificReview
  );

//   admin
module.exports = router;
