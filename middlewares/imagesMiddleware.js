const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadMixOfImages } = require("./uploadImageMiddleware");
const catchAsync = require("../utils/catchAsync");

exports.uploadImages = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
  { name: "avatar", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  // 1- Image processing for Avatar
  if (req.files.avatar) {
    const avatarFileName = `product-${uuidv4()}-${Date.now()}-avatar.jpeg`;
    await sharp(req.files.avatar[0].buffer)
      .resize({ fit: "cover" })
      .toFormat("png")
      .png()
      .toFile(`uploads/users/${avatarFileName}`);

    req.body.avatar = avatarFileName;
  }
  //2- Image processing for imageCover
  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize({ fit: "cover" })
      .toFormat("png")
      .png()
      .toFile(`uploads/products/${imageCoverFileName}`);

    // Save image into our db
    req.body.imageCover = imageCoverFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize({ fit: "cover" })
          .toFormat("png")
          .png()
          .toFile(`uploads/products/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      })
    );
  }
  next();
});
