import gestionProyectoService from "../../services/gestion/gestionProyectoService.js";
import gestionProyectoActividadService from "../../services/gestion/gestionProyectoActividadService.js";

const ok = (res, data, message = null) => res.json({ success: true, message, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, message: error.message || "Error Gestión" });

export const getAll = async (req, res) => {
  try { return ok(res, await gestionProyectoService.getAll(req.user)); }
  catch (e) { return fail(res, e); }
};

export const getById = async (req, res) => {
  try { return ok(res, await gestionProyectoService.getById(req.user, req.params.id)); }
  catch (e) { return fail(res, e, 404); }
};

export const create = async (req, res) => {
  try { return ok(res, await gestionProyectoService.create(req.user, req.body), "Proyecto creado"); }
  catch (e) { return fail(res, e); }
};

export const update = async (req, res) => {
  try { return ok(res, await gestionProyectoService.update(req.user, req.params.id, req.body), "Proyecto actualizado"); }
  catch (e) { return fail(res, e); }
};

export const addMember = async (req, res) => {
  try { return ok(res, await gestionProyectoService.addMember(req.user, req.params.id, req.body), "Miembro agregado"); }
  catch (e) { return fail(res, e); }
};

export const remove = async (
  req,
  res
) => {

  try {

    await gestionProyectoService.remove(
      req.user,
      req.params.id
    );

    return ok(
      res,
      true,
      "Proyecto eliminado"
    );

  } catch (e) {

    return fail(res, e);

  }

};

export const comentar = async (req, res) => {

  const actividad =
    await gestionProyectoActividadService.crear({
      proyecto_id: req.params.id,
      usuario_id: req.user.id,
      tipo: "COMENTARIO",
      comentario: req.body.comentario,
    });

  res.json(actividad);
};

export const removeMember = async (
  req,
  res
) => {

  try {

    return ok(
      res,
      await gestionProyectoService.removeMember(
        req.user,
        req.params.id,
        req.params.miembroId
      ),
      "Miembro eliminado"
    );

  } catch (e) {

    return fail(
      res,
      e
    );

  }

};