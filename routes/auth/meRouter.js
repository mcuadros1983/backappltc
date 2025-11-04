// // routes/auth/meRouter.js
// import { Router } from "express";
// import JWTAuth from "../../middleware/jwtMiddleware.js";
// const meRouter = Router();

// meRouter.get("/auth/me", JWTAuth, (req, res) => {
//   console.log("🔍 Cookies recibidas en /auth/me:", req.cookies);
//   console.log("🔍 Authorization header:", req.headers.authorization);
//   res.json({ user: req.user }); // {id, usuario, rol_id, permissions:[...]}
// });

// export default meRouter;


import { Router } from "express";
import JWTAuth from "../../middleware/jwtMiddleware.js";
import { attachPermissions } from "../../middleware/attachPermissions.js";

const meRouter = Router();

meRouter.get("/auth/me", JWTAuth, attachPermissions, (req, res) => {
  const { id, usuario, rol_id, permissions } = req.user || {};
  return res.json({ user: { id, usuario, rol_id, permissions: permissions || [] } });
});

export default meRouter;