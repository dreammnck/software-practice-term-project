const { Schema, model } = require('mongoose');

const reservationSchema = new Schema(
  {
    date: { type: Date, required: true },
    numberOfTables: { type: Number, required: true, min: 1, max: 3 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  },
  { timestamps: true }
);

module.exports = model('Reservation', reservationSchema);
