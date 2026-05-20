import { sequelize } from "../../config/database.js";
import {
  ComercioAsociado,
  ComercioQr,
} from "../../models/fidelizacion/index.js";
import {
  generarQrParaComercio,
  obtenerQrActivoPorComercio,
} from "../../services/fidelizacion/qrService.js";

const normalizarDocumento = (documento = "") => {
  return String(documento).replace(/\D/g, "").trim();
};

export const listarComerciosAsociados = async (req, res) => {
  try {
    const comercios = await ComercioAsociado.findAll({
      include: [
        {
          model: ComercioQr,
          as: "qrs",
          required: false,
          where: { estado: "activo" },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json({
      ok: true,
      data: comercios,
    });
  } catch (error) {
    console.error("[listarComerciosAsociados]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al listar comercios asociados",
      error: error.message,
    });
  }
};

export const obtenerComercioAsociadoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id, {
      include: [
        {
          model: ComercioQr,
          as: "qrs",
          required: false,
        },
      ],
    });

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: comercio,
    });
  } catch (error) {
    console.error("[obtenerComercioAsociadoPorId]", error);
    return res.status(500).json({
      ok: false,
      message: "Error al obtener comercio asociado",
      error: error.message,
    });
  }
};

export const crearComercioAsociado = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      nombre_fantasia,
      razon_social,
      documento_tipo,
      documento_numero,
      domicilio,
      telefono,
      email,
      lat,
      lon,
      radio_metros,
      estado,
      habilitado,
      permite_multiples_participaciones,
      limite_participaciones_diarias,
      limite_premios_diarios,
      observaciones,
      generar_qr = true,
    } = req.body;

    if (!nombre_fantasia || !documento_numero || !domicilio || !lat || !lon) {
      await transaction.rollback();
      return res.status(400).json({
        ok: false,
        message:
          "Los campos nombre_fantasia, documento_numero, domicilio, lat y lon son obligatorios",
      });
    }

    const documentoNormalizado = normalizarDocumento(documento_numero);

    const existente = await ComercioAsociado.findOne({
      where: {
        documento_numero: documentoNormalizado,
      },
      transaction,
    });

    if (existente) {
      await transaction.rollback();
      return res.status(409).json({
        ok: false,
        message: "Ya existe un comercio asociado con ese CUIT/DNI",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    const comercio = await ComercioAsociado.create(
      {
        nombre_fantasia,
        razon_social,
        documento_tipo: documento_tipo || "CUIT",
        documento_numero: documentoNormalizado,
        domicilio,
        telefono,
        email,
        lat,
        lon,
        radio_metros: radio_metros || 80,
        estado: estado || "activo",
        habilitado: habilitado ?? true,
        permite_multiples_participaciones:
          permite_multiples_participaciones ?? false,
        limite_participaciones_diarias: limite_participaciones_diarias || 1,
        limite_premios_diarios: limite_premios_diarios || null,
        observaciones,
        created_by: userId,
        updated_by: userId,
      },
      { transaction }
    );

    let qr = null;

    if (generar_qr) {
      qr = await generarQrParaComercio(comercio.id, transaction);
    }

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: "Comercio asociado creado correctamente",
      data: {
        comercio,
        qr,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("[crearComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al crear comercio asociado",
      error: error.message,
    });
  }
};

export const actualizarComercioAsociado = async (req, res) => {
  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id);

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    const {
      nombre_fantasia,
      razon_social,
      documento_tipo,
      documento_numero,
      domicilio,
      telefono,
      email,
      lat,
      lon,
      radio_metros,
      estado,
      habilitado,
      permite_multiples_participaciones,
      limite_participaciones_diarias,
      limite_premios_diarios,
      observaciones,
    } = req.body;

    const userId = req.user?.id || req.usuario?.id || null;

    await comercio.update({
      nombre_fantasia: nombre_fantasia ?? comercio.nombre_fantasia,
      razon_social: razon_social ?? comercio.razon_social,
      documento_tipo: documento_tipo ?? comercio.documento_tipo,
      documento_numero: documento_numero
        ? normalizarDocumento(documento_numero)
        : comercio.documento_numero,
      domicilio: domicilio ?? comercio.domicilio,
      telefono: telefono ?? comercio.telefono,
      email: email ?? comercio.email,
      lat: lat ?? comercio.lat,
      lon: lon ?? comercio.lon,
      radio_metros: radio_metros ?? comercio.radio_metros,
      estado: estado ?? comercio.estado,
      habilitado: habilitado ?? comercio.habilitado,
      permite_multiples_participaciones:
        permite_multiples_participaciones ??
        comercio.permite_multiples_participaciones,
      limite_participaciones_diarias:
        limite_participaciones_diarias ??
        comercio.limite_participaciones_diarias,
      limite_premios_diarios:
        limite_premios_diarios ?? comercio.limite_premios_diarios,
      observaciones: observaciones ?? comercio.observaciones,
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Comercio asociado actualizado correctamente",
      data: comercio,
    });
  } catch (error) {
    console.error("[actualizarComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al actualizar comercio asociado",
      error: error.message,
    });
  }
};

export const suspenderComercioAsociado = async (req, res) => {
  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id);

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await comercio.update({
      estado: "suspendido",
      habilitado: false,
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Comercio asociado suspendido correctamente",
      data: comercio,
    });
  } catch (error) {
    console.error("[suspenderComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al suspender comercio asociado",
      error: error.message,
    });
  }
};

export const activarComercioAsociado = async (req, res) => {
  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id);

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    const userId = req.user?.id || req.usuario?.id || null;

    await comercio.update({
      estado: "activo",
      habilitado: true,
      updated_by: userId,
    });

    return res.json({
      ok: true,
      message: "Comercio asociado activado correctamente",
      data: comercio,
    });
  } catch (error) {
    console.error("[activarComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al activar comercio asociado",
      error: error.message,
    });
  }
};

export const generarQrComercioAsociado = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id, { transaction });

    if (!comercio) {
      await transaction.rollback();
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    const qr = await generarQrParaComercio(comercio.id, transaction);

    await transaction.commit();

    return res.status(201).json({
      ok: true,
      message: "QR generado correctamente",
      data: qr,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("[generarQrComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al generar QR del comercio",
      error: error.message,
    });
  }
};

export const obtenerQrComercioAsociado = async (req, res) => {
  try {
    const { id } = req.params;

    const comercio = await ComercioAsociado.findByPk(id);

    if (!comercio) {
      return res.status(404).json({
        ok: false,
        message: "Comercio asociado no encontrado",
      });
    }

    const qr = await obtenerQrActivoPorComercio(id);

    if (!qr) {
      return res.status(404).json({
        ok: false,
        message: "El comercio no tiene un QR activo",
      });
    }

    return res.json({
      ok: true,
      data: qr,
    });
  } catch (error) {
    console.error("[obtenerQrComercioAsociado]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener QR del comercio",
      error: error.message,
    });
  }
};