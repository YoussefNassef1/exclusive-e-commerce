const mongoose = require("mongoose");

const app = require("./app");

const port = process.env.PORT;
const { DB } = process.env;

mongoose.connect(DB).then(() => {
  console.log("DB connection Successfully");
});

const server = app.listen(port, () => console.log(`port listing ${port}`));

// Handle rejection outside express

process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`shutting down...`);
    process.exit(1);
  });
});
