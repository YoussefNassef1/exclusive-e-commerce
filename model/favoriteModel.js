const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    favoriteItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        price: {
          type: Number,
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

favoriteSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: " email",
  }).populate({
    path: "favoriteItems.product",
    select: "name imageCover ",
  });

  next();
});

const Favorite = mongoose.model("favorite", favoriteSchema);

module.exports = Favorite;
