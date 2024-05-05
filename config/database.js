
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_DIALECT,
} = process.env;

const sequelize = new Sequelize("railway", "postgres", "SREHCLpjnkmHsHuwyqiZGugPMlwmCVwO", {
  host: "roundhouse.proxy.rlwy.net",
  port: 14155,
  dialect: "postgres",
  
  // Puedes agregar más configuraciones aquí según sea necesario
});

export { sequelize };


