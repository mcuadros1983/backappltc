import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Rol = sequelize.define("Rol", {
  nombre: {
    type: DataTypes.STRING,
    unique: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }
},
{
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
});

export default Rol;
