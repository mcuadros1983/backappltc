import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Rol from "./rolModel.js";
import bcrypt from "bcrypt";

const Usuario = sequelize.define("Usuario", {
  usuario: {
    type: DataTypes.STRING,
    unique:true
  },
  password: {
    type: DataTypes.STRING,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
  }

},
{
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
})

// Antes de crear el usuario, cifra la contraseña
Usuario.beforeCreate(async (user) => {
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  } catch (error) {
    console.error("Error al cifrar la contraseña:", error);
    throw error; // Puedes elegir manejar el error de otra manera según tus necesidades
  }
});

Usuario.belongsToMany(Rol, {
  through: "UsuarioRol",
  as: "roles",
  foreignKey: "usuario_id",
});
Rol.belongsToMany(Usuario, {
  through: "UsuarioRol",
  as: "usuarios",
  foreignKey: "rol_id",
});

export default Usuario;
