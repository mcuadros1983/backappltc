// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Unificamos el secreto con el que usás en loginMiddleware
const JWT_SECRET =
  process.env.JWT_SECRET_TOKEN ||
  process.env.JWT_SECRET ||
  "changeme-secret";

export const authenticate = (req, res, next) => {
  // 🟢 1) Si jwtFromCookie YA autenticó, no revalidamos
  if (req.user) {
    console.log("[authenticate] req.user ya existe, se omite verificación extra:", req.user);
    return next();
  }

  // 🟢 2) Intentar autenticar por header Authorization
  const raw = req.header("Authorization");

  if (!raw) {
    console.log("[authenticate] sin Authorization header → 401");
    return res.status(401).json({ error: "No autenticado" });
  }

  // Aceptar tanto "Bearer x" como el token pelado
  const token = raw.startsWith("Bearer ") ? raw.slice(7).trim() : raw.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Esperamos el mismo payload que generás en loginMiddleware:
    // { id, usuario, rol_id }
    req.user = {
      id: decoded.id,
      usuario: decoded.usuario,
      rol_id: decoded.rol_id,
    };

    console.log("[authenticate] user seteado desde Authorization header:", req.user);
    next();
  } catch (error) {
    console.error("[authenticate] token inválido:", error.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};
