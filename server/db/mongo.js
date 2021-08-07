const mongoose = require("mongoose");

const url = process.env.MONGO_URI;

const connectDb = () => {
  return mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then((result) => {
      console.log("Successfully connected to database.");
    })
    .catch((error) => {
      console.log("Error connecting to database:", error.message);
    });
};

const db = mongoose.connection;

module.exports = { db, connectDb };
