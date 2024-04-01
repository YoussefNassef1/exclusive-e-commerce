const express = require("express");

const router = express.Router();

const { protect } = require("../controllers/authController");
const {
  addProductCart,
  getLoggedUserCart,
  clearCart,
  updateCartItemQuantity,
  removeSpecificCartItem,
} = require("../controllers/cartController");

router.use(protect);

router.route("/").post(addProductCart).get(getLoggedUserCart).delete(clearCart);

router
  .route("/:itemId")
  .put(updateCartItemQuantity)
  .delete(removeSpecificCartItem);

module.exports = router;
