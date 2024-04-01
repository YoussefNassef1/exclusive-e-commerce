const bcrypt = require("bcryptjs");

const User = require("../model/userModel");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deletePhoto } = require("../utils/deletePhoto");
const handleFactory = require("./handlersFactory");

exports.getAllUsers = handleFactory.getAll(User);

exports.getUser = handleFactory.getOne(User);

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return next(new ApiError(`Can't find this user with id: ${id}`, 404));
  }

  deletePhoto([user.avatar], "users");

  res.status(204).json({
    status: "success",
    message: "User deleted successfully",
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userName, email, avatar, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    deletePhoto([avatar], "users");
    return next(new ApiError(`Can't find this user with id: ${id}`, 404));
  }

  const UpdateUser = await User.findByIdAndUpdate(
    id,
    { userName, email, role, avatar },
    {
      new: true,
    }
  );

  if (!UpdateUser) {
    deletePhoto([avatar], "users");
    return next(new ApiError(`Can't find this user with id: ${id}`, 404));
  }

  if (avatar) {
    deletePhoto([user.avatar], "users");
  }

  res.status(200).json({
    status: "success",
    data: UpdateUser,
  });
});

exports.changeUserPassword = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );

  if (!user) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }
  res.status(200).json({ status: "success", data: user });
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError(`No document for this id ${req.user._id}`, 404));
  }
  res.status(200).json({ status: "success", data: user });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { _id: id } = req.user;
  const { userName, email, avatar } = req.body;

  const user = await User.findById(id);
  if (!user) {
    deletePhoto([avatar], "users");
    return next(new ApiError(`Can't find this user with id: ${id}`, 404));
  }

  const updateUser = await User.findByIdAndUpdate(
    id,
    { userName, email, avatar },
    {
      new: true,
    }
  );

  if (!updateUser) {
    deletePhoto([avatar], "users");
    return next(new ApiError(`Can't find this user with id: ${id}`, 404));
  }

  if (avatar) {
    deletePhoto([user.avatar], "users");
  }

  res.status(200).json({
    status: "success",
    data: updateUser,
  });
});

exports.updateLoggedUserPassword = catchAsync(async (req, res, next) => {
  const { id } = req.user;
  const { oldPassword, password } = req.body;
  console.log(oldPassword, password);

  const user = await User.findById(id).select("+password");
  if (!user) {
    return next(new ApiError(`No document for this id ${id}`, 404));
  }
  const isMatch = await user.matchPassword(user.password, oldPassword, next);
  if (!isMatch) {
    return next(new ApiError("old password is incorrect", 401));
  }
  const updateUser = await User.findByIdAndUpdate(
    id,
    {
      password: await bcrypt.hash(password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "success",
    data: updateUser,
  });
});

exports.deleteLoggedUserData = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: "Success" });
});
