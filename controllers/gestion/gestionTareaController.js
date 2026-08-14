import gestionTareaService from "../../services/gestion/gestionTareaService.js";
import gestionTareaArchivoService
  from "../../services/gestion/gestionTareaArchivoService.js";

const ok = (res, data, message = null) => res.json({ success: true, message, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, message: error.message || "Error Gestión" });

export const getDashboard = async (req, res) => {
  try { return ok(res, await gestionTareaService.getDashboard(req.user)); }
  catch (e) { return fail(res, e); }
};

export const getCalendar = async (req, res) => {
  try { return ok(res, await gestionTareaService.getCalendar(req.user, req.query)); }
  catch (e) { return fail(res, e); }
};

export const getKanban = async (req, res) => {
  try { return ok(res, await gestionTareaService.getKanban(req.user, req.query)); }
  catch (e) { return fail(res, e); }
};

export const getAll = async (req, res) => {
  try { return ok(res, await gestionTareaService.getAll(req.user, req.query)); }
  catch (e) { return fail(res, e); }
};

export const getById = async (req, res) => {
  try { return ok(res, await gestionTareaService.getById(req.user, req.params.id)); }
  catch (e) { return fail(res, e, 404); }
};

export const create = async (req, res) => {
  try { return ok(res, await gestionTareaService.create(req.user, req.body), "Tarea creada"); }
  catch (e) { return fail(res, e); }
};

export const update = async (req, res) => {
  try { return ok(res, await gestionTareaService.update(req.user, req.params.id, req.body), "Tarea actualizada"); }
  catch (e) { return fail(res, e); }
};

export const changeStatus = async (req, res) => {
  try { return ok(res, await gestionTareaService.changeStatus(req.user, req.params.id, req.body.estado, req.body.comentario), "Estado actualizado"); }
  catch (e) { return fail(res, e); }
};

export const addComment = async (req, res) => {
  try { return ok(res, await gestionTareaService.addComment(req.user, req.params.id, req.body.comentario), "Comentario agregado"); }
  catch (e) { return fail(res, e); }
};

export const addChecklist = async (req, res) => {
  try { return ok(res, await gestionTareaService.addChecklist(req.user, req.params.id, req.body), "Checklist agregado"); }
  catch (e) { return fail(res, e); }
};

export const uploadArchivo = async (
  req,
  res
) => {

  console.log("================================");
  console.log("UPLOAD TAREA");
  console.log("req.file =>", req.file);
  console.log("req.files =>", req.files);
  console.log("req.body =>", req.body);
  console.log("================================");

  const archivo =
    await gestionTareaArchivoService
      .uploadArchivo(
        req.user,
        req.params.id,
        req.file
      );

  res.json({
    success: true,
    data: archivo,
  });
};

export const completeChecklist = async (req, res) => {
  try { return ok(res, await gestionTareaService.completeChecklist(req.user, req.params.id, req.body.completado ?? true), "Checklist actualizado"); }
  catch (e) { return fail(res, e); }
};

export const remove = async (
  req,
  res
) => {

  try {

    await gestionTareaService.remove(
      req.user,
      req.params.id
    );

    return ok(
      res,
      true,
      "Tarea eliminada"
    );

  } catch (e) {

    return fail(
      res,
      e
    );

  }

};

export const updateChecklist = async (
  req,
  res
) => {

  try {

    return ok(
      res,
      await gestionTareaService.updateChecklist(
        req.user,
        req.params.id,
        req.body
      ),
      "Checklist actualizado"
    );

  } catch (e) {

    return fail(
      res,
      e
    );

  }

};

export const removeChecklist = async (
  req,
  res
) => {

  try {

    return ok(
      res,
      await gestionTareaService.removeChecklist(
        req.user,
        req.params.id
      ),
      "Checklist eliminado"
    );

  } catch (e) {

    return fail(
      res,
      e
    );

  }

};

