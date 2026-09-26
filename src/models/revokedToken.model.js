const { Schema, model } = require('mongoose');

const revokedTokenSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true },
    // TTL index: MongoDB automatically deletes the document once expiresAt is in the past.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: false }
);

module.exports = model('RevokedToken', revokedTokenSchema);
