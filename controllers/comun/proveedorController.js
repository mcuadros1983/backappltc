// controllers/comun/proveedorController.js
import Proveedor from "../../models/comun/proveedor.js";
import { sequelize }  from "../../config/database.js";
// // Crear nuevo proveedor
// export const crearProveedor = async (req, res) => {
//   try {
//     const proveedor = await Proveedor.create(req.body);
//     res.status(201).json(proveedor);
//   } catch (error) {
//     res.status(500).json({ error: "Error al crear el proveedor" });
//   }
// };

export const crearProveedor = async (req, res) => {
  try {
    const {
      cuit
    } = req.body || {};


    // ==================================================
    // NORMALIZAR CUIT
    // ==================================================

    const cuitNormalizado =
      cuit &&
        String(cuit).trim()
        ? String(cuit).trim()
        : null;


    // ==================================================
    // VERIFICAR CUIT DUPLICADO
    // Solo si realmente se informó un CUIT
    // ==================================================

    if (cuitNormalizado) {

      const proveedorExistente =
        await Proveedor.findOne({
          where: {
            cuit:
              cuitNormalizado,
          },
        });


      if (proveedorExistente) {

        return res.status(400).json({
          error:
            "Ya existe un proveedor con ese CUIT",
        });
      }
    }


    // ==================================================
    // CREAR PROVEEDOR
    // ==================================================

    const proveedor =
      await Proveedor.create({
        ...req.body,

        cuit:
          cuitNormalizado,
      });


    return res.status(201).json(
      proveedor
    );

  } catch (error) {

    // ==================================================
    // MOSTRAR ERROR REAL EN BACKEND
    // ==================================================

    console.error(
      "❌ crearProveedor:",
      error
    );


    return res.status(500).json({
      error:
        error.message ||
        "Error al crear el proveedor",
    });
  }
};

// Listar todos los proveedores
export const listarProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      order: [
        [sequelize.fn("LOWER", sequelize.col("nombre")), "ASC"],
      ],
    });
    res.status(200).json(proveedores);
  } catch (error) {

    console.error(
      "❌ crearProveedor:",
      error
    );

    res.status(500).json({
      error:
        error.message ||
        "Error al crear el proveedor"
    });
  }
};

// Obtener proveedor por ID
export const obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el proveedor" });
  }
};

// Actualizar proveedor por ID
export const actualizarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    await proveedor.update(req.body);
    res.status(200).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el proveedor" });
  }
};

// Eliminar proveedor por ID
export const eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    await proveedor.destroy();
    res.status(200).json({ mensaje: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el proveedor" });
  }
};
