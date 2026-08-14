import { Router } from "express";
import JWTAuth from "../../middleware/jwtMiddleware.js";
import { attachPermissions } from "../../middleware/attachPermissions.js";

const meRouter = Router();

meRouter.get("/auth/me", JWTAuth, attachPermissions, (req, res) => {
  const { id, usuario, rol_id, sucursal_id, permissions } = req.user || {};
  return res.json({ user: { id, usuario, rol_id, sucursal_id, permissions: permissions || [] } });
});

export default meRouter;