import passport from "passport";
import jwt from "jsonwebtoken";

const loginMiddleware = (req, res, next) => {
  // El middleware de autenticación passport.authenticate maneja la lógica de inicio de sesión
  passport.authenticate(
    "login",
    { session: false },
    async (err, user, info) => {
      try {
        // Se verifica si hay un error o si el usuario no está presente
        if (err || !user) {

          // return res.status(404).json({ error: "User Not Found" });
          return res
            .status(401)
            .json({ error: info.message || "Authentication failed" });
        }

        // Si no hay errores, se realiza el inicio de sesión y se genera el token JWT
        req.login(user, { session: false }, async (err) => {
      
          if (err) {
     
            return next(err);
          }

          // Configuración del cuerpo del token JWT
          const body = {
            id: user.id,
            usuario: user.usuario,

          };


          // Generación del token JWT
          const token = jwt.sign(
            body,
            process.env.JWT_SECRET_TOKEN

          );


          // Obtén los datos del usuario como un objeto plano (sin métodos adicionales)
          const userPlainObject = user.get({ plain: true });

          // Construir un nuevo objeto que incluya la información del usuario y el token
          const userWithToken = {
            ...userPlainObject,
            token,
          };

          // Configuración de la cookie con el token JWT
          res.cookie("jwtToken", token, {
            httpOnly: true,
            domain: "localhost",
            path: "/",

          });
          res.json({ success: true, user: userWithToken });
        });
      } catch (e) {
        // Manejo de errores internos del servidor
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  )(req, res, next);
};

export default loginMiddleware;
