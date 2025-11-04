import { Router } from "express";
import * as usuariosController from "../../controllers/auth/usuariosController.js";
import { authorize } from "../../middleware/authorize.js";
import JWTAuth from "../../middleware/jwtMiddleware.js";

const usuariosRouter = Router();

// Usuarios CRUD
usuariosRouter.get("/usuarios", usuariosController.obtenerUsuarios);
// usuariosRouter.get("/usuarios/nombre/:usuario", usuariosController.obtenerUsuarioPorNombre); // (OJO: esta función no es handler Express; si esta ruta se usa, conviene crear un handler específico)
usuariosRouter.get("/usuarios/:id", usuariosController.obtenerUsuarioPorId);
usuariosRouter.post("/usuarios", usuariosController.crearUsuario);
usuariosRouter.put("/usuarios/:id", usuariosController.actualizarUsuario);
usuariosRouter.delete("/usuarios/:id", usuariosController.eliminarUsuario);

// 🔹 Shortcuts por usuario
// routes/auth/usuariosRouter.js
usuariosRouter.get("/usuarios/:id/shortcuts", usuariosController.getUserShortcuts);
usuariosRouter.post("/usuarios/:id/shortcuts", usuariosController.addUserShortcut);
usuariosRouter.delete("/usuarios/:id/shortcuts/:shortcutId", usuariosController.removeUserShortcut);
usuariosRouter.put("/usuarios/:id/shortcuts/reorder", usuariosController.reorderUserShortcuts);

usuariosRouter.get("/usuarios/:id/permissions", JWTAuth, authorize("admin.permissions.manage"), usuariosController.getPermissions);
usuariosRouter.put("/usuarios/:id/permissions", JWTAuth, authorize("admin.permissions.manage"), usuariosController.setPermissions);

// (opcional) reemplazo completo
usuariosRouter.put("/usuarios/:id/shortcuts", usuariosController.replaceUserShortcuts);

export default usuariosRouter;
