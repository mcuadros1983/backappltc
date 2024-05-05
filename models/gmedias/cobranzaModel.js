// cobranzaModel.js

import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import DetalleCobranza from "./detalleCobranzaModel.js";

const Cobranza = sequelize.define("Cobranza", {
  monto_total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  forma_cobro: {
    type: DataTypes.STRING,
  },
  descripcion_cobro: {
    type: DataTypes.STRING,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
},
{
  // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

Cobranza.hasMany(DetalleCobranza, {
  foreignKey: "cobranza_id",
  sourceKey: "id",
  as: "detalleCobranza",
  // allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "CASCADE", // Esta opción indica que debe elimin
});

DetalleCobranza.belongsTo(Cobranza, {
  foreignKey: "cobranza_id",
  targetKey: "id",
  // allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "CASCADE", // Esta opción indica que debe elimin  
});

export default Cobranza;
