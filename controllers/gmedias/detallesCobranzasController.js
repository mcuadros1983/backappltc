
import DetalleCobranza from "../../models/gmedias/detalleCobranzaModel.js";
import respuesta from "../../utils/respuesta.js";

export const registrarDetalleCobranza = async (cobranzaId, monto) => {  
  try {
    // Crear el detalle de la cobranza
    const detalleCobranza = await DetalleCobranza.create({ monto_total:monto });

    // Asociar el detalle de la cobranza con la cobranza
    await detalleCobranza.setCobranza(cobranzaId);

    return detalleCobranza
  } catch (error) {
    next(error);
  }
};

export const obtenerDetallesCobranzas = async (req, res, next) => {
  try {
    const detallesCobranzas = await DetalleCobranza.findAll();
    res.json(detallesCobranzas);
  } catch (error) {
    next(error);
  }
};

export const obtenerDetalleCobranzaPorId = async (req, res, next) => {
  try {
    const { detalleCobranzaId } = req.params;
    const detalleCobranza = await DetalleCobranza.findByPk(detalleCobranzaId);
    res.json(detalleCobranza);
  } catch (error) {
    next(error);
  }
};

export const actualizarDetalleCobranza = async (req, res, next) => {
  try {
    const { detalleCobranzaId } = req.params;
    const actualizacion = req.body;

    const [numFilasActualizadas, [detalleCobranzaActualizado]] =
      await DetalleCobranza.update(actualizacion, {
        where: { id: detalleCobranzaId },
        returning: true,
      });

    res.json(detalleCobranzaActualizado);
  } catch (error) {
    next(error);
  }
};

export const eliminarDetalleCobranza = async (req, res, next) => {
  try {
    const { detalleCobranzaId } = req.params;

    // Eliminar el detalle de la cobranza
    await DetalleCobranza.destroy({
      where: { id: detalleCobranzaId },
    });

    res.json({ mensaje: 'Detalle de cobranza eliminado con éxito' });
  } catch (error) {
    next(error);
  }
};
