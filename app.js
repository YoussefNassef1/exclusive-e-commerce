const express = require("express");

const app = express();

// access environment
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json");

// Routs
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const ApiError = require("./utils/ApiError");
const globalError = require("./middlewares/errorMiddleware");
const { webhookCheckout } = require("./controllers/orderController");

// limit request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this ip, please try again in an hour",
});

// Enable other domains to access your application
app.use(cors());
app.options("*", cors());

// Checkout webhook
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

//MiddleWare
app.use(express.json());
app.use(compression());

// status update
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// swagger API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mounts route
app.use("/api", limiter);
app.use(express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/favorite", favoriteRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/auth", authRoutes);

app.all("*", (req, res, next) => {
  // Create error and send it to Global Error
  next(new ApiError(`Can't find this Route: ${req.originalUrl}`, 400));
});
// Global Error handling middle ware
app.use(globalError);

module.exports = app;
