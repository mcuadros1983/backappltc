// rindeRouter.js
import { Router } from "express";
import * as navController from "../../controllers/nav/navController.js";

const navRouter = Router();

navRouter.get("/nav/links", navController.getNavLinks);
navRouter.get("/nav/search", navController.searchNav);

export default navRouter;
