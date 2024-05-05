// routes/authRoute.js
import express from "express";
import { Router } from "express";
import * as authController from "../../controllers/auth/authController.js";
import loginMiddleware from "../../middleware/loginMiddleware.js";

// const router = express.Router();
const authRouter = Router();

authRouter.post("/login", loginMiddleware);
authRouter.post("/logout", authController.logout);

export default authRouter;
