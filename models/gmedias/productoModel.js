import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
// import DetalleVenta from './detalleVentaModel.js';

const Producto = sequelize.define(
  "Producto",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    categoria_producto: { 
      type: DataTypes.STRING,
    },
    subcategoria: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codigo_de_barra: {
      type: DataTypes.STRING,
      unique: true, // Agregamos esta línea para el índice único
    },
    num_media: {
      type: DataTypes.STRING,
      unique: true, // Agregamos esta línea para el índice único
    },
    garron: {
      type: DataTypes.BIGINT,
    },
    precio: {
      type: DataTypes.FLOAT,
      // allowNull: false,
    },
    costo: {
      type: DataTypes.FLOAT,
      // allowNull: false,
    },
    kg: {
      type: DataTypes.DECIMAL,
    },
    tropa: {
      type: DataTypes.STRING,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      // allowNull: true,
      defaultValue: 18,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal("CURRENT_DATE"), // Establece la fecha actual por defecto
    },
  },
  {
    indexes: [
      {
        fields: ["codigo_de_barra"], // Índice explícito para optimizar búsquedas
      },
      {
        fields: ["num_media"], // Índice explícito para optimizar búsquedas
      },
    ],
    freezeTableName: true,
  }
  ,
  {
    //timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default Producto;
