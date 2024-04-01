const express = require("express");
const productController = require("../controllers/productController");
const {
  uploadImages,
  resizeProductImages,
} = require("../middlewares/imagesMiddleware");
const {
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/Validators/productValidator");

const reviewRouter = require("./reviewRoutes");

const router = express.Router();

router.use("/:productId/reviews", reviewRouter);

router
  .route("/")
  .post(uploadImages, resizeProductImages, productController.createProduct)
  .get(productController.getAllProducts);

router
  .route("/:id")
  .get(getProductValidator, productController.getProduct)
  .delete(deleteProductValidator, productController.deleteProduct)
  .put(
    updateProductValidator,
    uploadImages,
    resizeProductImages,
    productController.updateProduct
  );

module.exports = router;
