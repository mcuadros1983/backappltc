import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const VentaStatics = sequelize.define(
  "VentaStatics",
  {
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    sucursal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticket: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cliente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    descuento: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    anulada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    articulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalitem: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    preciopromo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    preciolista: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fecha2: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "VentaStatics",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["item_id", "ticket", "fecha2"], // Índice para evitar duplicados
      },
      {
        fields: ["sucursal"],
      },
      {
        fields: ["dni"],
      },
    ],
  }
);

export default VentaStatics;