// middleware/JWTAuth.js
import jwt from "jsonwebtoken";
import Usuario from "../models/auth/usuarioModel.js";

const JWTAuth = async (req, res, next) => {
  const token = req.cookies.jwtToken;
  if (!token) return res.status(401).json({ message: "Usuario no autorizado" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    const userDb = await Usuario.findByPk(payload.id, { attributes: ["id","usuario","rol_id","permissions"] });
    if (!userDb) return res.status(401).json({ message: "Token inválido" });

    req.user = {
      id: userDb.id,
      usuario: userDb.usuario,
      rol_id: userDb.rol_id,
      permissions: Array.isArray(userDb.permissions) ? userDb.permissions : [],
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Fallo en la autenticación del token" });
  }
};

export default JWTAuth;
