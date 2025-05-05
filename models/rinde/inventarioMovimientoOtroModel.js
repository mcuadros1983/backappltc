import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

const InventarioMovimientoOtro = sequelize.define(
    "Inventario_movimiento_otro",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      articulocodigo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      articulodescripcion: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      numerolote: {
        type: DataTypes.INTEGER,
      },
      cantidad: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sucursaldestino_id: {
        type: DataTypes.BIGINT,
      },
      tipo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      freezeTableName: true,
      indexes: [
        {
          fields: ['numerolote'], // índice sobre la columna numerolote
        },
      ],
    }
  );
  
  export default InventarioMovimientoOtro;
