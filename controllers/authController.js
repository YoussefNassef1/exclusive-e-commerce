const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const User = require("../model/userModel");
const createSendToken = require("../utils/createSendToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Signup
// @route   GET /api/v1/auth/signup
// @access  Public
exports.signUp = catchAsync(async (req, res, next) => {
  const { userName, email, password } = req.body;
  let token = crypto.randomBytes(20).toString("hex");
  //  create user
  const user = await User.create({
    userName,
    email,
    password,
    token,
  });

  try {
    const url = `${process.env.URL}/api/v1/auth/${user._id}/${user.token}`;
    const message = `Hi ${user.userName},\n We received a request to confirm your email on your Exclusive Account. 
     ${url} 
     Enter this code to complete the reset. 
     Thanks for helping us keep your account secure.\n The Exclusive Team`;

    await sendEmail({
      email: user.email,
      subject: "Your confirm email code (valid for 10 min)",
      message,
    });
  } catch (err) {
    await User.findByIdAndDelete(user.id);
    return next(new ApiError("There is an error in sending email", 500));
  }

  res.status(201).json({
    status: "success",
    message: "Email created successfully please confirm your email",
    user,
  });
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  const { id, token } = req.params;
  const user = await User.findOne({
    _id: id,
    token,
    confirmedExpires: { $gt: Date.now() },
  });

  if (!user) {
    await User.findOneAndDelete({ confirmedExpires: { $lte: Date.now() } });
    return next(new ApiError(" user invalid or token expired", 404));
  }
  user.confirmedEmail = true;
  user.token = undefined;
  user.confirmedExpires = undefined;
  res.redirect("http://localhost:5173/login");
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Email confirmed successfully",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  const isMatch = await user.matchPassword(user.password, password, next);

  if (!isMatch) {
    return next(new ApiError("Email or Password is incorrect", 401));
  }
  if (!user.confirmedEmail) {
    return next(
      new ApiError(
        "Email address is Not confirmed please confirm your email",
        402
      )
    );
  }
  createSendToken(200, user, res);
});

exports.logout = catchAsync((req, res, next) => {
  res.cookie("auth", "", {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    message: "Successfully logged out",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Check if token exist, if exist get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login, Please login to get access this route",
        401
      )
    );
  }

  // 2) Verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) Check if user exists
  const currentUser = await User.findById(decoded.payload);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }
  // 4) Check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // Password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password. please login again..",
          401
        )
      );
    }
  }
  // 5) Set user in req.user
  req.user = currentUser;
  next();
});

// @desc    Authorization (User Permissions)
// ["admin", "user"]
exports.allowedTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403)
      );
    }
    next();
  });

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  // 2) If user exist, Generate hash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  // Save hashed password reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password reset code (10 min)
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  // 3) Send the reset code via email
  const message = `Hi ${user.userName},\n We received a request to reset the password on your E-shop Account. 
   ${resetCode} 
   Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

exports.verifyPassResetCode = catchAsync(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");
  // 1) Get user by hashedResetCode
  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError(`Password reset code invalid`, 404));
  }
  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "Success",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code verified
  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  // change password
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;
  user.confirmedExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  // 3) if everything is ok, generate token
  createSendToken(200, user, res);
});
