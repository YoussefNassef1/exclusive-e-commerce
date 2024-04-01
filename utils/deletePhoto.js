const fs = require("fs");
const path = require("path");

const deletePhoto = (filepath, fileName) => {
  if (filepath[0] === undefined) {
    return;
  }
  let arr = filepath;
  arr.forEach((el) => {
    let image = path.join(__dirname, "../", "uploads", fileName, el);
    fs.unlink(image, (err) => {
      if (err) {
        throw err;
      }
    });
  });
};

exports.deletePhoto = deletePhoto;
