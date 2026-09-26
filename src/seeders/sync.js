require('dotenv').config();
const { mongoose, connect, User, Restaurant, Reservation, RevokedToken } = require('../models');

async function sync() {
  try {
    await connect();
    await Promise.all(
      [User, Restaurant, Reservation, RevokedToken].map((m) => m.syncIndexes())
    );
    console.log('Indexes synced.');
  } catch (err) {
    console.error('Failed to sync indexes:', err);
  } finally {
    await mongoose.disconnect();
  }
}

sync();
