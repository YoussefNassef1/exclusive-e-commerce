const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const User = require("../../model/userModel");

exports.updateUserPasswordValidation = [
  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
    .withMessage("Please choose a stronger password"),
  validatorMiddleware,
];

exports.updateUserValidation = [
  check("userName")
    .notEmpty()
    .optional()
    .withMessage("User required")
    .isLength({ min: 6 })
    .withMessage("Too short User name"),

  check("email")
    .notEmpty()
    .optional()
    .withMessage("Email required")
    .matches(/^\S+@\S+\.\S+$/)
    .withMessage("Invalid email address")
    .custom((val) =>
      User.findOne({ email: val }).then((user) => {
        if (user) {
          return Promise.reject(
            new Error(
              "An account already exists for this email address. Sign in or use a different email address to sign up."
            )
          );
        }
      })
    ),
  validatorMiddleware,
];
