// middleware/jwtFromCookie.js
import jwt from "jsonwebtoken";

export function jwtFromCookie(req, _res, next) {
  try {
    console.log("jwtfromCookie - cookies:", req.cookies);

    let token = req.cookies?.jwtToken;

    // 🔹 Si NO hay cookie, probamos con Authorization: Bearer xxx
    if (!token) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
        console.log("jwtFromCookie - token tomado de Authorization header");
      }
    }

    if (!token) {
      console.log("jwtfromCookie - no token found (ni cookie ni header)");
      return next();
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_SECRET_TOKEN;
    const payload = jwt.verify(token, secret);

    // payload esperado: { id, usuario, rol_id }
    req.user = {
      id: payload.id,
      usuario: payload.usuario,
      rol_id: payload.rol_id,
    };

    console.log("jwtFromCookie - user set in req:", req.user);
  } catch (e) {
    console.error("jwtFromCookie - error verifying token:", e.message);
    // token inválido/expirado: seguimos sin usuario
  }
  next();
}
