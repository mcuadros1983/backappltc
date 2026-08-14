  import { DataTypes } from "sequelize";
  import { sequelize } from "../../config/database.js";
  import Rol from "./rolModel.js";
  import bcrypt from "bcrypt";

  const Usuario = sequelize.define(
    "Usuario",
    {
      usuario: {
        type: DataTypes.STRING,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
      },
      rol_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sucursal_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        defaultValue: sequelize.literal("CURRENT_DATE"),
      },


      // 🔹 NUEVO: accesos directos persistidos por usuario
      // Estructura sugerida de cada item:
      // { id: "uuid", label: "Ventas Totales", path: "/sells/total", icon: "FiBarChart2", color: "#0ea5e9", order: 1 }
      shortcuts: {
        // Si tu DB soporta JSON (MySQL 5.7+/PG), dejá JSON.
        // Si NO, cambiá por DataTypes.TEXT y parseás/stringify en el controller.
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      // models/auth/usuarioModel.js
      permissions: {
        type: DataTypes.JSON,      // en PG → JSONB si usás migrations; en MySQL ≥5.7 → JSON
        allowNull: true,
        defaultValue: [],          // ["ventas.view","ventas.create", ...]
      },

    },
    {
      freezeTableName: true,
    }
  );

  // Hash de password al crear
  Usuario.beforeCreate(async (user) => {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      console.error("Error al cifrar la contraseña:", error);
      throw error;
    }
  });

  // Relaciones con roles (como ya tenías)
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
