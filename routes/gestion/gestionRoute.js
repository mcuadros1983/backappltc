import { Router } from "express";
import { authorize } from "../../middleware/authorize.js";
import upload
  from "../../middleware/uploadMiddleware.js";

import {
  getDashboard,
  getCalendar,
  getKanban,
  getAll as getTareas,
  getById as getTareaById,
  create as createTarea,
  update as updateTarea,
  changeStatus,
  addComment,
  addChecklist,
  completeChecklist,
  uploadArchivo,
  remove as removeTarea,
  updateChecklist,
  removeChecklist,
} from "../../controllers/gestion/gestionTareaController.js";
import {
  getAll as getProyectos,
  getById as getProyectoById,
  create as createProyecto,
  update as updateProyecto,
  addMember,
  removeMember,
  comentar,
  remove,
} from "../../controllers/gestion/gestionProyectoController.js";

const router = Router();

router.get("/gestion/dashboard", authorize("gestion:view"), getDashboard);
router.get("/gestion/calendario", authorize("gestion:view"), getCalendar);

router.get("/gestion/tareas/kanban", authorize("gestion:view"), getKanban);
router.get("/gestion/tareas", authorize("gestion:view"), getTareas);
router.get("/gestion/tareas/:id", authorize("gestion:view"), getTareaById);
router.post("/gestion/tareas", authorize("gestion.tareas:create"), createTarea);
router.put("/gestion/tareas/:id", authorize("gestion.tareas:update"), updateTarea);
router.post("/gestion/tareas/:id/estado", authorize("gestion.tareas:update"), changeStatus);
router.post("/gestion/tareas/:id/comentarios", authorize("gestion.tareas:update"), addComment);
router.post("/gestion/tareas/:id/checklist", authorize("gestion.tareas:update"), addChecklist);
router.post("/gestion/tareas/:id/archivos", authorize("gestion:view"), upload.single("archivo"), uploadArchivo);
router.post("/gestion/checklist/:id/completar", authorize("gestion.tareas:update"), completeChecklist);
router.put(
  "/gestion/checklist/:id",
  authorize("gestion.tareas:update"),
  updateChecklist
);

router.delete(
  "/gestion/checklist/:id",
  authorize("gestion.tareas:update"),
  removeChecklist
);
router.delete(
  "/gestion/tareas/:id",
  authorize("gestion.tareas:update"),
  removeTarea
);

router.get("/gestion/proyectos", authorize("gestion:view"), getProyectos);
router.get("/gestion/proyectos/:id", authorize("gestion:view"), getProyectoById);
router.post("/gestion/proyectos", authorize("gestion.proyectos:create"), createProyecto);
router.post(
  "/proyectos/:id/comentario", authorize("gestion:view"), comentar);
router.put("/gestion/proyectos/:id", authorize("gestion.proyectos:update"), updateProyecto);
router.delete(
  "/gestion/proyectos/:id",
  authorize("gestion.proyectos:update"),
  remove
);
router.post("/gestion/proyectos/:id/miembros", authorize("gestion.proyectos:update"), addMember);
// router.delete(
//   "/gestion/proyectos/:id/miembros/:miembroId",
//   authorize("gestion.proyectos:update"),
//   removeMember
// );

router.delete(
  "/gestion/proyectos/:id/miembros/:miembroId",
  authorize("gestion.proyectos:update"),
  (req, res, next) => {

    console.log(
      "DELETE MIEMBRO",
      req.params
    );

    next();

  },
  removeMember
);

export default router;
