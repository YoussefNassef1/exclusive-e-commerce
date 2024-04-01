const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const sendForDevelop = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
const sendForProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendForDevelop(err, res);
  } else {
    sendForProd(err, res);
  }
};

module.exports = globalError;
