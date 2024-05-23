// import UsersRepository from '../persistence/repository/usersRepository.js'
// const UsersRepo = new UsersRepository()

import { obtenerUsuarioPorNombre } from "../controllers/auth/usuariosController.js"; 
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";

passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "usuario",
      passwordField: "password",
    },
    async (usuario, password, done) => {
      // console.log("obteniendousuario", usuario, password)
      try {
        const user = await obtenerUsuarioPorNombre(usuario);  
        // console.log("user passport", user)

        if (!user) {
          return done(null, false, { message: "User not found." });
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
          try {
            if (isMatch) {
              return done(null, user);
            } else { 
              return done(null, false, {
                message: "Error al iniciar sesión. Verifica tu usuario y contraseña",
              });
            }
          } catch (err) {
            return done(err);
          }
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);
