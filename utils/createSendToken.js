const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const signToken = (payload) =>
  jwt.sign({ payload }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

const createSendToken = (status, user, res) => {
  const token = signToken(user._id);

  res.cookie("auth", token, {
    expires: new Date(
      Date.now() + process.env.JWT_EXPIRES_COOKIES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });

  user.password = undefined;
  user.confirmedExpires = undefined;

  res.status(status).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

module.exports = createSendToken;
