const { check, body } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const idValidator = check("id").isMongoId().withMessage("Invalid ID formate");

exports.getProductValidator = [idValidator, validatorMiddleware];

exports.updateProductValidator = [
  idValidator,
  body("userName").optional(),
  validatorMiddleware,
];

exports.deleteProductValidator = [idValidator, validatorMiddleware];
