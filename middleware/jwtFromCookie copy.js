// middleware/jwtFromCookie.js
import jwt from "jsonwebtoken";

export function jwtFromCookie(req, _res, next) {
  try {
    console.log("jwtfromCookie - cookies:", req.cookies);
    const token = req.cookies?.jwtToken;
    if (!token) {
      console.log("jwtfromCookie - no token found");
      return next()
    };
    const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.JWT_SECRET_TOKEN);
    // payload esperado: { id, usuario, ... }
    req.user = { id: payload.id, usuario: payload.usuario, rol_id: payload.rol_id };
    console.log("jwtFromCookie - user set in req:", req.user);
  } catch (e) {
    console.error("jwtFromCookie - error verifying token:", e.message );
    // token inválido/expirado: seguimos sin usuario
  }
  next();
}
