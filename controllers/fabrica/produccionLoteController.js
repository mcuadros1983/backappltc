import ProduccionLote from "../../models/fabrica/produccionLoteModel.js";
import ProduccionLoteDetalle from "../../models/fabrica/produccionLoteDetalleModel.js";
import ArticuloTabla from "../../models/tablas/articuloModel.js";
import { Op } from "sequelize";

export const obtenerArticulosProduccion = async (req, res) => {

  try {

    const articulos = await ArticuloTabla.findAll({
      attributes: [
        "id",
        "codigobarra",
        "descripcion"
      ],
      order: [
        ["descripcion", "ASC"]
      ]
    });

    res.json(articulos);

  } catch (error) {

    console.error(error);

    res.status(500).json(error);

  }

};

export const listarProduccionLotes = async (req, res) => {
  try {

    const rows = await ProduccionLote.findAll({

      include: [
        {
          model: ProduccionLoteDetalle,
          as: "detalles",
        }
      ],

      order: [["id", "DESC"]],

    });

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json(error);

  }
};

export const obtenerProduccionLote = async (req, res) => {
  try {
    const row = await ProduccionLote.findByPk(req.params.id, {
      include: [
        {
          model: ProduccionLoteDetalle,
          as: "detalles",
        },
      ],
    });

    res.json(row);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
};
export const crearProduccionLote = async (req, res) => {

  const transaction =
    await ProduccionLote.sequelize.transaction();

  try {

    const {
      fecha_produccion,
      fecha_vencimiento,
      observaciones,
      usuario_id,
      empresa_id,
      detalles,
    } = req.body;

    const year =
      new Date().getFullYear();

    const ultimoLote =
      await ProduccionLote.findOne({

        where: {
          numero_lote: {
            [Op.like]:
              `LT-${year}-%`,
          },
        },

        order: [["id", "DESC"]],

        transaction,

      });

    let correlativo = 1;

    if (ultimoLote) {

      const partes =
        ultimoLote.numero_lote.split("-");

      correlativo =
        parseInt(partes[2], 10) + 1;

    }

    const numero_lote =
      `LT-${year}-${String(correlativo).padStart(6, "0")}`;

    const cantidad_productos =
      detalles?.length || 0;

    const total_kg =
      detalles?.reduce(
        (total, item) =>
          total +
          Number(item.cantidad || 0),
        0
      ) || 0;

    const lote =
      await ProduccionLote.create(
        {
          numero_lote,

          fecha_produccion,
          fecha_vencimiento,

          observaciones,

          estado: "CONFIRMADO",

          usuario_id,
          empresa_id,

          cantidad_productos,
          total_kg,

        },
        { transaction }
      );

    if (detalles?.length) {

      const detallesData =
        detalles.map((item) => ({

          produccion_lote_id:
            lote.id,

          articulo_id:
            item.articulo_id,

          cantidad:
            item.cantidad,

          observaciones:
            item.observaciones || null,

        }));

      await ProduccionLoteDetalle.bulkCreate(
        detallesData,
        {
          transaction,
        }
      );

    }

    await transaction.commit();

    res.status(201).json({
      ok: true,
      lote,
    });

  } catch (error) {

    await transaction.rollback();

    console.error(error);

    res.status(500).json(error);

  }

};

export const actualizarProduccionLote = async (req, res) => {

  const transaction =
    await ProduccionLote.sequelize.transaction();

  try {

    const { id } = req.params;

    const lote =
      await ProduccionLote.findByPk(
        id,
        { transaction }
      );

    if (!lote) {

      await transaction.rollback();

      return res.status(404).json({
        message:
          "Lote no encontrado",
      });

    }

    const {
      fecha_produccion,
      fecha_vencimiento,
      observaciones,
      detalles,
    } = req.body;

    const cantidad_productos =
      detalles?.length || 0;

    const total_kg =
      detalles?.reduce(
        (total, item) =>
          total +
          Number(item.cantidad || 0),
        0
      ) || 0;

    await lote.update(
      {
        fecha_produccion,
        fecha_vencimiento,
        observaciones,

        cantidad_productos,
        total_kg,

      },
      { transaction }
    );

    await ProduccionLoteDetalle.destroy({

      where: {
        produccion_lote_id: id,
      },

      transaction,

    });

    if (detalles?.length) {

      const detallesData =
        detalles.map((item) => ({

          produccion_lote_id:
            id,

          articulo_id:
            item.articulo_id,

          cantidad:
            item.cantidad,

          observaciones:
            item.observaciones || null,

        }));

      await ProduccionLoteDetalle.bulkCreate(
        detallesData,
        {
          transaction,
        }
      );

    }

    await transaction.commit();

    res.json({
      ok: true,
      message:
        "Lote actualizado",
    });

  } catch (error) {

    await transaction.rollback();

    console.error(error);

    res.status(500).json(error);

  }

};

export const eliminarProduccionLote = async (req, res) => {
  const transaction = await ProduccionLote.sequelize.transaction();

  try {
    const { id } = req.params;

    await ProduccionLoteDetalle.destroy({
      where: {
        produccion_lote_id: id,
      },
      transaction,
    });

    await ProduccionLote.destroy({
      where: {
        id,
      },
      transaction,
    });

    await transaction.commit();

    res.json({
      ok: true,
      message: "Lote eliminado",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json(error);
  }
};

