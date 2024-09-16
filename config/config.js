import { config } from 'dotenv';
config();

export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PORT = process.env.DB_PORT;
export const DB_DIALECT = process.env.DB_DIALECT;
// export const LOCAL_HOST = process.env.LOCAL_HOST || 'https://frontappltc-production.up.railway.app'
export const LOCAL_HOST = process.env.LOCAL_HOST || 'http://localhost:3000'
export const PORT = process.env.PORT || 5000;
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
