const Product = require("../model/productModel");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { deletePhoto } = require("../utils/deletePhoto");
const handlersFactory = require("./handlersFactory");

exports.createProduct = handlersFactory.createOne(Product);

exports.getAllProducts = handlersFactory.getAll(Product);

exports.getProduct = handlersFactory.getOne(Product);

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const document = await Product.findById(id);
  if (!document) {
    // Delete the image coming from the multer middleware if no document
    if (req.body.imageCover) {
      deletePhoto([req.body.imageCover], "products");
    }

    if (req.body.images) {
      deletePhoto([...req.body.images], "products");
    }

    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }

  if (req.files.images) {
    deletePhoto([...document.images], "products");
  }

  if (req.files.imageCover) {
    deletePhoto([document.imageCover], "products");
  }

  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    message: `${Product.modelName} with id: ${id} updated successfully`,
    data: {
      product,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const document = await Product.findByIdAndDelete(id);
  deletePhoto([document.imageUrl, ...document.images], "products");

  if (!document) {
    return next(
      new ApiError(`Can't find this ${Product.modelName} with id: ${id}`, 404)
    );
  }
  res.status(204).json({
    status: "success",
    message: `${Product.modelName} with id: ${id} deleted successfully`,
  });
});
