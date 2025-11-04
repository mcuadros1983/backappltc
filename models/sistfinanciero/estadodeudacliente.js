import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const EstadoDeudaCliente = sequelize.define("EstadoDeudaCliente", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  estadoAnterior: {
    type: DataTypes.ENUM("pendiente", "vencida", "pagada"),
    allowNull: false,
  },
  nuevoEstado: {
    type: DataTypes.ENUM("pendiente", "vencida", "pagada"),
    allowNull: false,
  },
  fechaCambio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

export default EstadoDeudaCliente;
