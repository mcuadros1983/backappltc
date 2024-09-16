import jwt from "jsonwebtoken";

const JWTAuth = (req, res, next) => {
  const token = req.cookies.jwtToken;

  // console.log(`Token recibido: ${token}`);

  if (!token) {
    // console.log("No token provided");
    res.clearCookie("jwtToken", {
      // httpOnly: true,
      // domain: "localhost",
      // path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API : 'localhost',
      path: '/',
    });
    return res.status(401).json({ message: "Usuario no autorizado" });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    console.log("Usuario autenticado:", user);
    req.user = user;
    next();
  } catch (err) {
    console.log("Error en la verificación del token:", err);
    res.clearCookie("jwtToken", {
      // httpOnly: true,
      // domain: "localhost",
      // path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API : 'localhost',
      path: '/',
    });
    return res.status(401).json({ message: "Fallo en la autenticación del token" });
  }
};

export default JWTAuth;
