import { Router } from "express";
import * as rolesController from "../../controllers/auth/rolesController.js";

// const router = express.Router();
const rolesRouter = Router();

// Rutas para sucursales
rolesRouter.get("/roles", rolesController.obtenerRoles);
rolesRouter.get("/roles/:id", rolesController.obtenerRolPorId);
rolesRouter.post("/roles", rolesController.crearRol);
rolesRouter.put("/roles/:id", rolesController.actualizarRol);
rolesRouter.delete("/roles/:id", rolesController.eliminarRol);

// export default router;
export default rolesRouter;
