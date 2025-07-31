const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("✅ MongoDB connected");
}

function getDB() {
  if (!db) throw new Error("DB not connected");
  return db;
}

module.exports = { connectDB, getDB };
