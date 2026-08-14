// app.js
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
// import dotenv from "dotenv";
import passport from "passport";            // 👈 NUEVO
import path from 'path';

import { LOCAL_HOST } from "./config/config.js";
import router from "./routes/indexRoute.js";

// Middlewares propios
import { jwtFromCookie } from "./middleware/jwtFromCookie.js";
import { auditALSMiddleware } from "./middleware/auditALSMiddleware.js";

// 👇 MUY IMPORTANTE: registra la estrategia "login"
import "./config/passport.js";              // 👈 NUEVO (side-effect: passport.use('login', ...))

// dotenv.config();

console.log("========== ENV BOT CHECK ==========");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);

console.log("WHATSAPP_PROVIDER:", process.env.WHATSAPP_PROVIDER);
console.log("WHATSAPP_GRAPH_API_VERSION:", process.env.WHATSAPP_GRAPH_API_VERSION);
console.log("WHATSAPP_PHONE_NUMBER_ID:", process.env.WHATSAPP_PHONE_NUMBER_ID);

console.log(
  "WHATSAPP_ACCESS_TOKEN:",
  process.env.WHATSAPP_ACCESS_TOKEN
    ? `${process.env.WHATSAPP_ACCESS_TOKEN.slice(0, 12)}...${process.env.WHATSAPP_ACCESS_TOKEN.slice(-8)}`
    : "NO DEFINIDO"
);

console.log(
  "WHATSAPP_ACCESS_TOKEN length:",
  process.env.WHATSAPP_ACCESS_TOKEN?.length || 0
);

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY
    ? `${process.env.OPENAI_API_KEY.slice(0, 8)}...${process.env.OPENAI_API_KEY.slice(-6)}`
    : "NO DEFINIDO"
);

console.log("===================================");

const app = express();
app.set('trust proxy', 1); // importante detrás del proxy de Railway

const __dirname = path.resolve();

// app.js
// const ALLOWED_ORIGINS = [
//   LOCAL_HOST,
//   process.env.FRONTEND_URL,
//   "http://localhost:3000",
//   // acá podés sumar el dominio real que usás en el celu si es otro
// ].filter(Boolean);

const ALLOWED_ORIGINS = [
  LOCAL_HOST,
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PUBLIC_URL,
  process.env.PUBLIC_FIDELIZACION_URL,
  "http://localhost:3000",
  "https://latradicionsorteos.com",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        console.log("[CORS] origin vacío (posible same-origin / móvil). Permitido.");
        return callback(null, true);
      }

      console.log("[CORS] origin recibido:", origin);

      if (ALLOWED_ORIGINS.includes(origin)) {
        console.log("[CORS] origin PERMITIDO:", origin);
        return callback(null, true);
      }

      console.warn("[CORS] origin NO permitido:", origin);
      return callback(new Error("Origen no permitido por CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// app.use(
//   cors({
//     origin: LOCAL_HOST,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

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
