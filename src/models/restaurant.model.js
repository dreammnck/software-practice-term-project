const { Schema, model } = require('mongoose');

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true },
    telephone: { type: String, required: true },
    // Stored as "HH:MM" (24h) strings — Mongo has no dedicated TIME type.
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = model('Restaurant', restaurantSchema);
