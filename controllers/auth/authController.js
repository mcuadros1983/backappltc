// controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Usuario from "../../models/auth/usuarioModel.js";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (user) => {
  const payload = {
    id: user.id,
    usuario: user.usuario,
    rol_id: user.rol_id,
    // Puedes incluir más información en el token según tus necesidades
  };

  return jwt.sign(payload, process.env.JWT_SECRET_TOKEN,
    // { expiresIn: "1h" }
  )
    ;
};

export const register = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    const user = await Usuario.create({ usuario, password });

    const token = generateToken(user);

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
};

export const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    console.log("login ", req.user);
    // console.log("credenciales", usuario, password);

    const user = await Usuario.findOne({ where: { usuario } });
    // console.log("userfound", user);

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = generateToken(user);
    // console.log("token", token);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

export const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "Strict" : "Lax",
    path: "/",
  };
  // en dev: NO pongas domain. En prod, si usaste domain al setear, repetilo:
  if (isProd && process.env.COOKIE_DOMAIN) {
    opts.domain = process.env.COOKIE_DOMAIN;
  }

  res.clearCookie("jwtToken", opts);
  res.cookie("jwtToken", "", { ...opts, maxAge: 0 });
  return res.status(200).json({ success: true });
};