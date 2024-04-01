const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const {
  addProductToFavorite,
  getLoggedUserFavorite,
  removeSpecificFavoriteItems,
  clearFavorite,
} = require("../controllers/favoriteController");

router
  .route("/")
  .post(authController.protect, addProductToFavorite)
  .get(authController.protect, getLoggedUserFavorite)
  .delete(authController.protect, clearFavorite);

router.delete("/:itemId", authController.protect, removeSpecificFavoriteItems);

module.exports = router;
