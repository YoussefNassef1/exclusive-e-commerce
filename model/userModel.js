const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      required: [true, "name required"],
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password required"],
      minlength: [6, "Too short password"],
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "defaultAvatar.png",
    },
    token: String,
    confirmedExpires: {
      type: Date,
      default: Date.now() + 10 * 60 * 1000, // 10 minutes
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    confirmedEmail: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (
  candidatePassword,
  userPassword,
  next
) {
  if (!candidatePassword || !userPassword) {
    return next(new ApiError("password is undefined"));
  }
  return bcrypt.compare(userPassword, candidatePassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
