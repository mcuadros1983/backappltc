import { Router } from "express";
import * as usuariosController from "../../controllers/auth/usuariosController.js";

// const router = express.Router();
const usuariosRouter = Router();

// Rutas para sucursales
usuariosRouter.get("/usuarios", usuariosController.obtenerUsuarios);
usuariosRouter.get("/usuarios/nombre/:usuario", usuariosController.obtenerUsuarioPorNombre);
usuariosRouter.get("/usuarios/:id", usuariosController.obtenerUsuarioPorId);
usuariosRouter.post("/usuarios", usuariosController.crearUsuario);
usuariosRouter.put("/usuarios/:id", usuariosController.actualizarUsuario);
usuariosRouter.delete("/usuarios/:id", usuariosController.eliminarUsuario);

// export default router;
export default usuariosRouter;
