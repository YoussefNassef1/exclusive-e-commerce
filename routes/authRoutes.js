const express = require("express");

const router = express.Router();

const {
  signUp,
  confirmEmail,
  login,
  forgetPassword,
  verifyPassResetCode,
  resetPassword,
  logout,
} = require("../controllers/authController");
const {
  signupValidator,
  loginValidator,
  resetPasswordValidator,
  idValidator,
} = require("../utils/Validators/authValidator");

router.post("/signup", signupValidator, signUp);
router.get("/:id/:token", idValidator, confirmEmail);
router.post("/login", loginValidator, login);
router.get("/logout", logout);
router.post("/forgetPassword", forgetPassword);
router.post("/verifyResetCode", verifyPassResetCode);
router.put("/resetPassword", resetPasswordValidator, resetPassword);

module.exports = router;
