const mongoose = require("mongoose");

const connectDb = async (uri = process.env.CONNECTION_STRING) => {
  const conn = await mongoose.connect(uri);
  console.log("Database connected:", conn.connection.host, conn.connection.name);
  return conn;
};

module.exports = connectDb;
