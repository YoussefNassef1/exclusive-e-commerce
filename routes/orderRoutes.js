const express = require("express");

const router = express.Router();

const { allowedTo, protect } = require("../controllers/authController");
const {
  createCashOrder,
  updateOrderToPaid,
  updateOrderToDelivered,
  filterOrderForLoggedUser,
  getAllOrder,
  getOrder,
  checkOutSessions,
} = require("../controllers/orderController");

// to protect all routes
router.use(protect);

router.get("/checkout-session/:cartId", allowedTo("admin"), checkOutSessions);

//  create cash order route
router.post("/:cartId", allowedTo("user"), createCashOrder);

// get all orders route
router.get(
  "/",
  // allowedTo("user", "admin", "manager"),
  filterOrderForLoggedUser,
  getAllOrder
);

// get one order route
router.get("/:id", getOrder);

// change order to pay
router.put("/:id/pay", allowedTo("admin", "manager"), updateOrderToPaid);

// change order to deliver route
router.put(
  "/:id/deliver",
  allowedTo("admin", "manager"),
  updateOrderToDelivered
);

module.exports = router;
