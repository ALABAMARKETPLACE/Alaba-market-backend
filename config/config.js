require("dotenv").config();
const path = require("path");

console.log("DB HOST:", process.env.DATABASE_HOST); // temp debug

module.exports = {
  development: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE || process.env.DATABASE,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: "postgres",
    logging: console.log,
    dialectOptions: {
      ssl: {
        require: process.env.DATABASE_SSL === "true",
        rejectUnauthorized: false,
      },
    },
  },

  production: {
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE || process.env.DATABASE,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: process.env.DATABASE_SSL === "true",
        rejectUnauthorized: false,
      },
    },
  },
};