import { Router } from "express";
import * as reciboLinkController from "../../controllers/sueldoempleado/reciboLinkController.js";

const reciboLinkRouter = Router();

// POST /links/recibo/:id  -> { url, expIn }
reciboLinkRouter.post("/links/recibo/:id", reciboLinkController.createLinkFirmadoRecibo);

export default reciboLinkRouter;
