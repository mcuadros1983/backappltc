import { Router } from "express";
import * as reciboPublicHtmlController from "../../controllers/sueldoempleado/reciboPublicHtmlController.js"

const reciboPublicHtmlRouter = Router();

// GET /public/recibo/:id?exp=...&sig=...
reciboPublicHtmlRouter.get("/public/recibo/:id", reciboPublicHtmlController.getReciboHtmlPublic);

export default reciboPublicHtmlRouter;
