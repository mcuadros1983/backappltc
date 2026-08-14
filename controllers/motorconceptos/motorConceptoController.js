import motorConceptoService from "../../services/motorconceptos/motorConceptoService.js";

const ok = (res, data, message = null, status = 200) =>
  res.status(status).json({ success: true, message, data });

const fail = (res, error, status = 400) =>
  res.status(error.status || status).json({
    success: false,
    message: error.message || "Error en Motor de Conceptos",
  });

export const seedEntidadTipos = async (req, res) => {
  try { return ok(res, await motorConceptoService.seedEntidadTipos(req.user), "Catálogo inicializado"); }
  catch (e) { return fail(res, e); }
};

export const getEntidadTipos = async (req, res) => {
  try { return ok(res, await motorConceptoService.getEntidadTipos(req.user)); }
  catch (e) { return fail(res, e); }
};

export const getAll = async (req, res) => {
  try { return ok(res, await motorConceptoService.getAll(req.user, req.query)); }
  catch (e) { return fail(res, e); }
};

export const getById = async (req, res) => {

  try {
    console.log("GET /:id =", req.params.id);
    return ok(res, await motorConceptoService.getById(req.user, req.params.id));
  }
  catch (e) { return fail(res, e, 404); }
};

export const create = async (req, res) => {
  try { return ok(res, await motorConceptoService.create(req.user, req.body), "Concepto creado", 201); }
  catch (e) { return fail(res, e); }
};

export const update = async (req, res) => {
  try { return ok(res, await motorConceptoService.update(req.user, req.params.id, req.body), "Concepto actualizado"); }
  catch (e) { return fail(res, e); }
};

export const remove = async (req, res) => {
  try {
    await motorConceptoService.remove(req.user, req.params.id);
    return ok(res, true, "Concepto eliminado");
  } catch (e) { return fail(res, e); }
};

export const createField = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.createField(req.user, req.params.id, req.body), "Campo creado", 201);
  } catch (e) { return fail(res, e); }
};

export const updateField = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.updateField(
      req.user, req.params.id, req.params.fieldId, req.body
    ), "Campo actualizado");
  } catch (e) { return fail(res, e); }
};

export const removeField = async (req, res) => {
  try {
    await motorConceptoService.removeField(req.user, req.params.id, req.params.fieldId);
    return ok(res, true, "Campo eliminado");
  } catch (e) { return fail(res, e); }
};

export const createFileType = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.createFileType(req.user, req.params.id, req.body), "Tipo de archivo creado", 201);
  } catch (e) { return fail(res, e); }
};

export const updateFileType = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.updateFileType(
      req.user, req.params.id, req.params.fileTypeId, req.body
    ), "Tipo de archivo actualizado");
  } catch (e) { return fail(res, e); }
};

export const removeFileType = async (req, res) => {
  try {
    await motorConceptoService.removeFileType(req.user, req.params.id, req.params.fileTypeId);
    return ok(res, true, "Tipo de archivo eliminado");
  } catch (e) { return fail(res, e); }
};

export const createRule = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.createRule(req.user, req.params.id, req.body), "Regla creada", 201);
  } catch (e) { return fail(res, e); }
};

export const updateRule = async (req, res) => {
  try {
    return ok(res, await motorConceptoService.updateRule(
      req.user, req.params.id, req.params.ruleId, req.body
    ), "Regla actualizada");
  } catch (e) { return fail(res, e); }
};

export const removeRule = async (req, res) => {
  try {
    await motorConceptoService.removeRule(req.user, req.params.id, req.params.ruleId);
    return ok(res, true, "Regla eliminada");
  } catch (e) { return fail(res, e); }
};

export const getCumplimiento = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoService.getCumplimiento(
        req.user,
        req.query
      )
    );
  } catch (e) {
    return fail(res, e);
  };
};

export const getVencimientos = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoService.getVencimientos(
        req.user,
        req.query
      )
    );
  } catch (e) {
    return fail(res, e);
  }
};
