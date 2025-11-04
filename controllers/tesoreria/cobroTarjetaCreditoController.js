import CobroTarjetaCredito from "../../models/tesoreria/cobrotarjetacredito.js";

// Crear cobro
export const crearCobroTarjetaCredito = async (req, res) => {
    try {
        const cobro = await CobroTarjetaCredito.create(req.body);
        res.status(201).json(cobro);
    } catch (error) {
        res.status(500).json({
            error: "Error al crear el cobro con tarjeta de crédito",
            detalle: error.message
        });
    }
};

// Listar todos los cobros
export const listarCobrosTarjetaCredito = async (req, res) => {
    try {
        const cobros = await CobroTarjetaCredito.findAll();
        res.status(200).json(cobros);
    } catch (error) {
        res.status(500).json({
            error: "Error al obtener los cobros con tarjeta de crédito",
            detalle: error.message
        });
    }
};

// Obtener cobro por ID
export const obtenerCobroTarjetaCreditoPorId = async (req, res) => {
    try {
        const cobro = await CobroTarjetaCredito.findByPk(req.params.id);
        if (!cobro) {
            return res.status(404).json({ error: "Cobro con tarjeta de crédito no encontrado" });
        }
        res.status(200).json(cobro);
    } catch (error) {
        res.status(500).json({
            error: "Error al obtener el cobro con tarjeta de crédito",
            detalle: error.message
        });
    }
};

// Actualizar cobro
export const actualizarCobroTarjetaCredito = async (req, res) => {
    try {
        const cobro = await CobroTarjetaCredito.findByPk(req.params.id);
        if (!cobro) {
            return res.status(404).json({ error: "Cobro con tarjeta de crédito no encontrado" });
        }
        await cobro.update(req.body);
        res.status(200).json(cobro);
    } catch (error) {
        res.status(500).json({
            error: "Error al actualizar el cobro con tarjeta de crédito",
            detalle: error.message
        });
    }
};

// Eliminar cobro
export const eliminarCobroTarjetaCredito = async (req, res) => {
    try {
        const cobro = await CobroTarjetaCredito.findByPk(req.params.id);
        if (!cobro) {
            return res.status(404).json({ error: "Cobro con tarjeta de crédito no encontrado" });
        }
        await cobro.destroy();
        res.status(200).json({ mensaje: "Cobro con tarjeta de crédito eliminado correctamente" });
    } catch (error) {
        res.status(500).json({
            error: "Error al eliminar el cobro con tarjeta de crédito",
            detalle: error.message
        });
    }
};
