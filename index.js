require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

const connection = require("./src/utils/db");
// const { setupBullBoard } = require("./src/utils/bullBoard");

connection(process.env.MONGO_URI)
  .then((response) => {
    app.listen(PORT, () => {
      console.log("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");
      // setupBullBoard();
      console.log(`Server running on port ${PORT}`);
      console.log("-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+");
    });
  })
  .catch((error) => {
    console.log("Error starting an application", error);
  });
