import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js"; 
import { Venta } from "./ventaModel.js";

const FormaPago = sequelize.define("FormaPago", {
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
  // Otros campos de la forma de pago
},
{
  // timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

// Definir relaciones
FormaPago.hasMany(Venta, { 
  foreignKey: "formaPago_id",
  sourceKey: "id",
  as:"ventas",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "RESTRICT",
});

Venta.belongsTo(FormaPago, {
  foreignKey: "formaPago_id",
  targetKey: "id",
  allowNull: true, // Esta opción indica que la relación no es obligatoria
  onDelete: "RESTRICT",
});

export default FormaPago;
