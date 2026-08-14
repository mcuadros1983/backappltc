// controllers/authController.js
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Usuario from "../../models/auth/usuarioModel.js";

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

// export const logout = (req, res) => {
//   const isProd = process.env.NODE_ENV === "production";
//   const opts = {
//     httpOnly: true,
//     secure: isProd,
//     sameSite: isProd ? "Strict" : "Lax",
//     path: "/",
//   };
//   // en dev: NO pongas domain. En prod, si usaste domain al setear, repetilo:
//   if (isProd && process.env.COOKIE_DOMAIN) {
//     opts.domain = process.env.COOKIE_DOMAIN;
//   }

//   res.clearCookie("jwtToken", opts);
//   res.cookie("jwtToken", "", { ...opts, maxAge: 0 });
//   return res.status(200).json({ success: true });
// };

export const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  // Si usaste dominio al setear (p.ej. .midominio.com), ponelo acá:
  const cookieDomain = isProd ? process.env.COOKIE_DOMAIN || undefined : undefined;

  const base = {
    httpOnly: true,
    secure: isProd,           // En prod debe ser true (HTTPS)
    path: "/",
  };

  // Variante para entornos cross-site (frontend/backend en dominios distintos)
  const cross = {
    ...base,
    sameSite: "None",
    secure: true,             // obligatorio con SameSite=None
  };

  // Variante "local" (por si durante pruebas quedó una cookie Lax/Sin dominio)
  const local = {
    ...base,
    sameSite: "Lax",
  };

  // 1) Borrar host-only (sin domain)
  res.clearCookie("jwtToken", { ...cross });
  res.cookie("jwtToken", "", { ...cross, expires: new Date(0), maxAge: 0 });

  res.clearCookie("jwtToken", { ...local });
  res.cookie("jwtToken", "", { ...local, expires: new Date(0), maxAge: 0 });

  // 2) Si usaste domain al setear, borrar también con domain
  if (cookieDomain) {
    res.clearCookie("jwtToken", { ...cross, domain: cookieDomain });
    res.cookie("jwtToken", "", { ...cross, domain: cookieDomain, expires: new Date(0), maxAge: 0 });

    res.clearCookie("jwtToken", { ...local, domain: cookieDomain });
    res.cookie("jwtToken", "", { ...local, domain: cookieDomain, expires: new Date(0), maxAge: 0 });
  }

  return res.status(200).json({ success: true });
};
