const { Sequelize } = require("sequelize");
require("dotenv").config();
const database = process.env.db;

module.exports = new Sequelize(database);
