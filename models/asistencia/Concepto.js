// /src/models/concepto/concepto.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Concepto = sequelize.define("Concepto", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: "Nombre del Concepto",
  },

  codigo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: "Código del Concepto",
  },
}, {
  tableName: "concepto",
  freezeTableName: true,
  timestamps: false,
});

export default Concepto;
