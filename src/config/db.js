const mongoose = require('mongoose');
require('dotenv').config();

mongoose.set('strictQuery', true);

async function connect() {
  await mongoose.connect(process.env.MONGODB_URI);
  return mongoose.connection;
}

module.exports = { mongoose, connect };
