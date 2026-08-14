import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const DatosEmpleado = sequelize.define("DatosEmpleado", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  // Un registro por empleado
  empleado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // 1 a 1 con Empleadotabla
  },

  // Sucursal a la que pertenece (opcional)
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // ⬇️ reemplazo de turno_id por jornada_id
  jornada_id: { type: DataTypes.INTEGER, allowNull: true },

  // Teléfono (opcional)
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      is: {
        args: [/^[+()\-.\s0-9]+$/],
        msg: "El formato del teléfono no es válido",
      },
    },
  },

  // Francos: 1..7 (Lun..Dom). Permitir null (sin asignar)
  franco_am: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 7 },
  },
  franco_pm: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 7 },
  },
  tipo: {
    type: DataTypes.ENUM("ENCARGADO", "VENDEDOR"),
    allowNull: true,
    defaultValue: "VENDEDOR",
  },

}, {
  tableName: "datosempleado",
  timestamps: false,
  freezeTableName: true,
});

export default DatosEmpleado;
