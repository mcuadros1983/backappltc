import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ArcaTicket = sequelize.define("ArcaTicket", {
  cache_key: { type: DataTypes.STRING(64), primaryKey: true },
  contenido_cifrado: { type: DataTypes.TEXT, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, { tableName: "arca_ticket", timestamps: true });

export default ArcaTicket;
