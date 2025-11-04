// En tu archivo usuarioController.js

import Usuario from "../../models/auth/usuarioModel.js";
import bcrypt from "bcrypt";
import { obtenerRolPorNombre } from "./rolesController.js";

export const obtenerUsuarios = async (req, res, next) => {
  try {
    // Incluir la información de los roles asociados al usuario
    const usuarios = await Usuario.findAll({
      include: "roles", // Este nombre debe coincidir con el alias definido en las relaciones del modelo Usuario
    });
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const obtenerUsuarioPorId = async (req, res, next) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.findByPk(id, {
      include: "roles", // Utiliza el alias definido en el modelo Usuario
    });
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const crearUsuario = async (req, res, next) => {
  const { usuario, password, nombreRol } = req.body;
  // console.log("datos usuario", usuario, password, nombreRol);
  try {
    // Verificar si ya existe un usuario admin
    const userFound = await obtenerUsuarioPorNombre(usuario);

    // console.log("text7", userFound);
    if (userFound) {
      // console.log("Usuario ya existe.");
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Obtener el rol de administrador
    const rol = await obtenerRolPorNombre(nombreRol);
    // console.log("text8", rol);

    // Crear un nuevo usuario admin
    const newUser = await Usuario.create({
      usuario,
      password,
      rol_id: rol.dataValues.id, // Asignar el ID del rol admin directamente al campo role_id
    });

    // Asociar los roles al usuario admin
    await newUser.setRoles(rol);

    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    next(error);
  }
};


export const actualizarUsuario = async (req, res, next) => {
  const { id } = req.params;
  const { usuario, password, nombreRol } = req.body;


  try {
    // Verificar si el usuario a actualizar existe
    const usuarioExistente = await Usuario.findByPk(id);

    if (usuarioExistente) {
      // Crear un objeto para almacenar los campos que se actualizarán
      const nuevosDatos = {};

      // Verificar y agregar el usuario si se proporciona
      if (usuario) {
        nuevosDatos.usuario = usuario;
      }

      // Verificar y agregar la contraseña si se proporciona
      if (password) {
        // Encriptar la nueva contraseña antes de almacenarla
        const hashedPassword = await bcrypt.hash(password, 10);
        nuevosDatos.password = hashedPassword;
      }

      // Verificar y agregar el nuevo rol si se proporciona
      if (nombreRol) {
        // Obtener el rol correspondiente al nombreRol
        const rol = await obtenerRolPorNombre(nombreRol);
        nuevosDatos.rol_id = rol.dataValues.id;

        // Asociar el nuevo rol al usuario
        await usuarioExistente.setRoles(rol);
      }

      // Actualizar el usuario con los nuevos datos
      await usuarioExistente.update(nuevosDatos);

      res.json(usuarioExistente);
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  const { id } = req.params;

  try {
    const usuarioExistente = await Usuario.findByPk(id);

    if (usuarioExistente) {
      await usuarioExistente.destroy();
      res.json({ message: "Usuario eliminado exitosamente" });
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const obtenerUsuarioPorNombre = async (usuario) => {

  try {
    const user = await Usuario.findOne({ where: { usuario } });
    if (user) {
      return user;
    } else {
      console.error("usuario no encontrado");
    }
  } catch (error) {
    console.error(error);
    // next(error);
  }
};
