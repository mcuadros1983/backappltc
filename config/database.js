import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

import {
  // DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
  DB_DATABASE,
} from "./config.js";

const sequelize = new Sequelize(DB_DATABASE,DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,

  // Puedes agregar más configuraciones aquí según sea necesario
});

export { sequelize };
