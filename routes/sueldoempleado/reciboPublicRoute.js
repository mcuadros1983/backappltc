import { Router } from "express";
import * as reciboPublicController from "../../controllers/sueldoempleado/reciboPublicController.js";

const reciboPublicRouter = Router();

// GET /public/recibo/:id.pdf?exp=...&sig=...
reciboPublicRouter.get("/public/recibo/:id.pdf", reciboPublicController.getReciboPdfPublic);

export default reciboPublicRouter;
