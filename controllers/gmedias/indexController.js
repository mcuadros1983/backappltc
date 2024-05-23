import { obtenerSucursales } from "./sucursalesController.js";
import { obtenerClientes } from "./clientesController.js";
import { obtenerUsuarios } from "../auth/usuariosController.js";

export const index = async (req, res, next) => {
  try {
    const user = req.user;
    // console.log("userindex", user, req.user)
    res.status(200);

  } catch (err) {

    console.error(err);
    next(err)

  }
};
