// middleware/jwtFromCookie.js
import jwt from "jsonwebtoken";

export function jwtFromCookie(req, _res, next) {
  try {
    const token = req.cookies?.jwtToken;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_TOKEN);
    // payload esperado: { id, usuario, ... }
    req.user = { id: payload.id, usuario: payload.usuario, rol_id: payload.rol_id };
  } catch (e) {
    // token inválido/expirado: seguimos sin usuario
  }
  next();
}
