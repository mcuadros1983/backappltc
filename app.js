import express from "express";
// import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { PORT, LOCAL_HOST } from "./config/config.js";

import router from "./routes/indexRoute.js";
import "./config/passport.js";

dotenv.config();

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: LOCAL_HOST,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(morgan("dev"));
app.use(cookieParser());

app.use(router);
// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

export default app;
