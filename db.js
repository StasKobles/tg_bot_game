const { Sequelize } = require("sequelize");
require("dotenv").config();
const database = process.env.DB;

module.exports = new Sequelize(database);
