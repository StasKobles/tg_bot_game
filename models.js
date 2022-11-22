const sequelize = require("./db");
const { DataTypes } = require("sequelize");

const UserTelegram = sequelize.define("userTg", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
  },
  chatId: { type: DataTypes.STRING, unique: true },
  right: { type: DataTypes.INTEGER, defaultValue: 0 },
  wrong: { type: DataTypes.INTEGER, defaultValue: 0 },
});

module.exports = UserTelegram;
