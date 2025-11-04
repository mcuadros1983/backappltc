// models/sueldoempleado/AdicionalVariableTipo.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const AdicionalVariableTipo = sequelize.define("AdicionalVariableTipo", { 
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descripcion: { type: DataTypes.TEXT, allowNull: true },
  // Nuevo: categoría del tipo (suma o resta en la liquidación)
  categoria: {
    type: DataTypes.ENUM("adicional", "descuento"),
    allowNull: true, // puede quedar sin definir
    // opcional: valor por defecto si querés
    // defaultValue: "adicional", 
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default AdicionalVariableTipo;