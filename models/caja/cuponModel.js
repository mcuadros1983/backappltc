import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
const Cupon = sequelize.define(
  "Cupon",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cuponId: {
      type: DataTypes.BIGINT,
    },
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    importecupon: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    importecuponconrecargo: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    lote: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nrocupon: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plantarjeta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    // tableName: "cupon",
    timestamps: false,
    freezeTableName: true,
  }
);

export default Cupon;
