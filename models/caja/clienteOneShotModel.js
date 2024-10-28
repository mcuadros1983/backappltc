import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

// Definición del modelo Clienteoneshot
const Clienteoneshot = sequelize.define(
  "Clienteoneshot",
  {
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    domicilio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2), // Decimal con dos decimales para manejar el monto
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

export default Clienteoneshot;
