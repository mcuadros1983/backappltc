import motorConceptoRegistroService from "../../services/motorconceptos/motorConceptoRegistroService.js";

const ok = (res, data, message = null, status = 200) =>
  res.status(status).json({
    success: true,
    message,
    data,
  });

const fail = (res, error, fallbackStatus = 400) =>
  res.status(error.status || fallbackStatus).json({
    success: false,
    message: error.message || "Error en registros del Motor de Conceptos",
  });

export const getAll = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.getAll(req.user, req.query)
    );
  } catch (error) {
    return fail(res, error);
  }
};

export const getById = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.getById(req.user, req.params.id)
    );
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const getHistory = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.getHistory(req.user, req.params.id)
    );
  } catch (error) {
    return fail(res, error, 404);
  }
};

export const create = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.create(req.user, req.body),
      "Registro creado",
      201
    );
  } catch (error) {
    return fail(res, error);
  }
};

export const createVersion = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.createVersion(
        req.user,
        req.params.id,
        req.body
      ),
      "Nueva versión creada",
      201
    );
  } catch (error) {
    return fail(res, error);
  }
};

export const changeStatus = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.changeStatus(
        req.user,
        req.params.id,
        req.body
      ),
      "Estado actualizado"
    );
  } catch (error) {
    return fail(res, error);
  }
};

export const remove = async (req, res) => {
  try {
    await motorConceptoRegistroService.remove(req.user, req.params.id);
    return ok(res, true, "Registro eliminado");
  } catch (error) {
    return fail(res, error);
  }
};

export const markExpired = async (req, res) => {
  try {
    return ok(
      res,
      await motorConceptoRegistroService.markExpired(req.user),
      "Vencimientos actualizados"
    );
  } catch (error) {
    return fail(res, error);
  }
};
