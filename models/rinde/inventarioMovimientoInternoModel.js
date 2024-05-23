import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

const InventarioMovimientoInterno = sequelize.define( 
  "Inventario_movimiento_interno",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
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
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default InventarioMovimientoInterno;
