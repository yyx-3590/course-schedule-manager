const { MongoMemoryServer } = require("mongodb-memory-server");

// Starts one in-memory MongoDB for the whole test run.
module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = mongod.getUri();
  global.__MONGOD__ = mongod;
};
