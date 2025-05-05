// Importa tus modelos y configuración de sequelize según sea necesario
import Rol from "../models/auth/rolModel.js";
import Usuario from "../models/auth/usuarioModel.js";
import { sequelize } from "../config/database.js";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "../config/config.js";

export const crearRoles = async () => {
  try {
    // Sincronizar los modelos con la base de datos
    await sequelize.sync();

    // Verificar si existen los roles
    const rolesExistentes = await Rol.findAll({ where: { nombre: ['admin', 'gestion', 'ventas', 'sucursales','mantenimiento'] } });

    const roles = ['admin', 'gestion', 'ventas', 'sucursales','mantenimiento'];
    
    // Crea solo los roles que no existen
    for (const rol of roles) {
      if (!rolesExistentes.some(existingRole => existingRole.nombre === rol)) {
        await Rol.create({ nombre: rol });
        console.log(`Rol creado: ${rol}`);
      }
    }

    // Crear el usuario admin
    crearAdmin();
  } catch (error) {
    console.error(error);
  }
};

export const crearAdmin = async () => { 
  try {
    // Verificar si ya existe un usuario admin
    const userFound = await Usuario.findOne({
      where: { usuario: ADMIN_USERNAME },
    });

    if (userFound) {
      return; // Puedes ajustar según tus preferencias
    }

    // Obtener el rol de administrador
    const rol = await Rol.findOne({ where: { nombre: "admin" } });

    // Crear un nuevo usuario admin
    const newUser = await Usuario.create({
      usuario: ADMIN_USERNAME,
      //   email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      rol_id: rol.dataValues.id, // Asignar el ID del rol admin directamente al campo role_id
    });

    // Asociar los roles al usuario admin
    await newUser.setRoles(rol);

  } catch (error) {
    console.error(error);
  }
};

// Llama a las funciones para crear roles y el usuario admin
crearRoles();
