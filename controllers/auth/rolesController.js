import Rol from "../../models/auth/rolModel.js";

const obtenerRoles = async (req, res, next) => {
  try {
    const roles = await Rol.findAll();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error al obtener roles:", error);
    next(error);
  }
};

const obtenerRolPorId = async (req, res, next) => {
  const { id } = req.params;
  try {
    const rol = await Rol.findByPk(id);
    if (rol) {
      res.status(200).json(rol);
    } else {
      res.status(404).json({ error: "Rol no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener rol por ID:", error);
    next(error);
  }
};

const obtenerRolPorNombre = async (nombre) => {
  // const { nombre } = req.params;
  try {
    const rol = await Rol.findOne({ where: { nombre } });
    if (rol) {
      return rol
    } else {
      console.log("rol no encontrado")
    }
  } catch (error) {
    console.error("Error al obtener rol por nombre:", error);
  }
};

const crearRol = async (req, res, next) => {
  const { nombre } = req.body;
  try {
    // Verificar si el rol ya existe
    const rolExistente = await Rol.findOne({ where: { nombre } });
    if (rolExistente) {
      return res.status(400).json({ error: "El rol ya existe" });
    }

    // Crear el nuevo rol
    const nuevoRol = await Rol.create({ nombre });
    res.status(201).json(nuevoRol);
  } catch (error) {
    console.error("Error al crear un nuevo rol:", error);
    next(error);
  }
};

const actualizarRol = async (req, res, next) => {
  const { id } = req.params;
  const { nombre } = req.body;
  try {
    const rol = await Rol.findByPk(id);
    if (rol) {
      await rol.update({ nombre });
      res.status(200).json(rol);
    } else {
      res.status(404).json({ error: "Rol no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar rol por ID:", error);
    next(error);
  }
};

const eliminarRol = async (req, res, next) => {
  const { id } = req.params;
  try {
    const rol = await Rol.findByPk(id);
    if (rol) {
      await rol.destroy();
      res.status(204).send();
    } else {
      res.status(404).json({ error: "Rol no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar rol por ID:", error);
    next(error);
  }
};

export {
  obtenerRoles,
  obtenerRolPorId,
  obtenerRolPorNombre,
  crearRol,
  actualizarRol,
  eliminarRol,
};
