// app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import passport from "passport";            // 👈 NUEVO
import path from 'path';

import { LOCAL_HOST } from "./config/config.js";
import router from "./routes/indexRoute.js";

// Middlewares propios
import { jwtFromCookie } from "./middleware/jwtFromCookie.js";
import { auditALSMiddleware } from "./middleware/auditALSMiddleware.js";

// 👇 MUY IMPORTANTE: registra la estrategia "login"
import "./config/passport.js";              // 👈 NUEVO (side-effect: passport.use('login', ...))

dotenv.config();

const app = express();
app.set('trust proxy', 1); // importante detrás del proxy de Railway

const __dirname = path.resolve();

app.use(
  cors({
    origin: LOCAL_HOST,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, 'static')));

// 👇 Inicializa passport (necesario para passport.authenticate('login', ...))
app.use(passport.initialize());             // 👈 NUEVO
// Si NO usás sesiones de passport, no llames a passport.session()

// Tu JWT → req.user (no bloquea si no hay cookie)
app.use(jwtFromCookie);

// ALS para auditoría (contexto por request)
app.use(auditALSMiddleware);

// Rutas
app.use(router);

// 404
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// Handler de errores
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(err.status || 500).json({ error: err.message || "Error interno" });
});

export default app;
