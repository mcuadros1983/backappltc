// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/jwt.js";

export const authenticate = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    // Si no hay token, redirecciona al formulario de inicio de sesión
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(error);
    // Si el token no es válido, redirecciona al formulario de inicio de sesión
    res.redirect("/login");
  }
};
