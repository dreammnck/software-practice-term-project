const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');

class User extends Model {
  async validatePassword(plainPassword) {
    return comparePassword(plainPassword, this.password);
  }

  toSafeJSON() {
    const { id, name, telephone, email, role, createdAt, updatedAt } = this;
    return { id, name, telephone, email, role, createdAt, updatedAt };
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        user.password = await hashPassword(user.password);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await hashPassword(user.password);
        }
      },
    },
  }
);

module.exports = User;
