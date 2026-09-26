const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class RevokedToken extends Model {}

RevokedToken.init(
  {
    jti: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'RevokedToken',
    tableName: 'revoked_tokens',
    timestamps: false,
  }
);

module.exports = RevokedToken;
