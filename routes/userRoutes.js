const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  getMe,
  updateMe,
  updateLoggedUserPassword,
  deleteLoggedUserData,
} = require("../controllers/userController");
const {
  uploadImages,
  resizeProductImages,
} = require("../middlewares/imagesMiddleware");
const {
  updateUserPasswordValidation,
  updateUserValidation,
} = require("../utils/Validators/userValidator");
const { idValidator } = require("../utils/Validators/authValidator");

// user Controllers
router.use(authController.protect);

router.route("/getMe").get(getMe);

router
  .route("/updateMe")
  .put(uploadImages, resizeProductImages, updateUserValidation, updateMe);

router
  .route("/changeMyPassword")
  .put(updateUserPasswordValidation, updateLoggedUserPassword);

router.route("/deleteMe").delete(deleteLoggedUserData);

// adminController
router.use(authController.protect, authController.allowedTo("admin"));
router.route("/").get(getAllUsers);

router.put(
  "/changePassword/:id",
  idValidator,
  updateUserPasswordValidation,
  changeUserPassword
);

router
  .route("/:id")
  .get(idValidator, getUser)
  .put(
    idValidator,
    uploadImages,
    resizeProductImages,
    updateUserValidation,
    updateUser
  )
  .delete(idValidator, deleteUser);

module.exports = router;
