import ComercioAsociado from "./comercioAsociadoModel.js";
import ComercioQr from "./comercioQrModel.js";
import CampaniaFidelizacion from "./campaniaFidelizacionModel.js";
import PremioCliente from "./premioClienteModel.js";
import ClienteFidelizacion from "./clienteFidelizacionModel.js";
import ParticipacionCliente from "./participacionClienteModel.js";
import CuponCliente from "./cuponClienteModel.js";
import CanjeCuponCliente from "./canjeCuponClienteModel.js";
import PuntoComercioMovimiento from "./puntoComercioMovimientoModel.js";
import PremioComercio from "./premioComercioModel.js";
import CanjePremioComercio from "./canjePremioComercioModel.js";
import AlertaFraude from "./alertaFraudeModel.js";

const initFidelizacionAssociations = () => {
  ComercioAsociado.hasMany(ComercioQr, {
    foreignKey: "comercio_id",
    as: "qrs",
  });

  ComercioQr.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  ComercioAsociado.hasMany(ParticipacionCliente, {
    foreignKey: "comercio_id",
    as: "participaciones",
  });

  ParticipacionCliente.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  ComercioAsociado.hasMany(CuponCliente, {
    foreignKey: "comercio_id",
    as: "cupones",
  });

  CuponCliente.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  ComercioAsociado.hasMany(CanjeCuponCliente, {
    foreignKey: "comercio_id",
    as: "canjes",
  });

  CanjeCuponCliente.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  ComercioAsociado.hasMany(PuntoComercioMovimiento, {
    foreignKey: "comercio_id",
    as: "movimientosPuntos",
  });

  PuntoComercioMovimiento.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  CampaniaFidelizacion.hasMany(PremioCliente, {
    foreignKey: "campania_id",
    as: "premios",
  });

  PremioCliente.belongsTo(CampaniaFidelizacion, {
    foreignKey: "campania_id",
    as: "campania",
  });

  CampaniaFidelizacion.hasMany(ParticipacionCliente, {
    foreignKey: "campania_id",
    as: "participaciones",
  });

  ParticipacionCliente.belongsTo(CampaniaFidelizacion, {
    foreignKey: "campania_id",
    as: "campania",
  });

  CampaniaFidelizacion.hasMany(CuponCliente, {
    foreignKey: "campania_id",
    as: "cupones",
  });

  CuponCliente.belongsTo(CampaniaFidelizacion, {
    foreignKey: "campania_id",
    as: "campania",
  });

  PremioCliente.hasMany(ParticipacionCliente, {
    foreignKey: "premio_cliente_id",
    as: "participaciones",
  });

  ParticipacionCliente.belongsTo(PremioCliente, {
    foreignKey: "premio_cliente_id",
    as: "premio",
  });

  PremioCliente.hasMany(CuponCliente, {
    foreignKey: "premio_cliente_id",
    as: "cupones",
  });

  CuponCliente.belongsTo(PremioCliente, {
    foreignKey: "premio_cliente_id",
    as: "premio",
  });

  PremioCliente.hasMany(CanjeCuponCliente, {
    foreignKey: "premio_cliente_id",
    as: "canjes",
  });

  CanjeCuponCliente.belongsTo(PremioCliente, {
    foreignKey: "premio_cliente_id",
    as: "premio",
  });

  ClienteFidelizacion.hasMany(ParticipacionCliente, {
    foreignKey: "cliente_id",
    as: "participaciones",
  });

  ParticipacionCliente.belongsTo(ClienteFidelizacion, {
    foreignKey: "cliente_id",
    as: "cliente",
  });

  ClienteFidelizacion.hasMany(CuponCliente, {
    foreignKey: "cliente_id",
    as: "cupones",
  });

  CuponCliente.belongsTo(ClienteFidelizacion, {
    foreignKey: "cliente_id",
    as: "cliente",
  });

  ClienteFidelizacion.hasMany(CanjeCuponCliente, {
    foreignKey: "cliente_id",
    as: "canjes",
  });

  CanjeCuponCliente.belongsTo(ClienteFidelizacion, {
    foreignKey: "cliente_id",
    as: "cliente",
  });

  ParticipacionCliente.belongsTo(CuponCliente, {
    foreignKey: "cupon_id",
    as: "cupon",
  });

  CuponCliente.belongsTo(ParticipacionCliente, {
    foreignKey: "participacion_id",
    as: "participacion",
  });

  CuponCliente.hasOne(CanjeCuponCliente, {
    foreignKey: "cupon_id",
    as: "canje",
  });

  CanjeCuponCliente.belongsTo(CuponCliente, {
    foreignKey: "cupon_id",
    as: "cupon",
  });

  CuponCliente.hasMany(PuntoComercioMovimiento, {
    foreignKey: "cupon_id",
    as: "movimientosPuntos",
  });

  PuntoComercioMovimiento.belongsTo(CuponCliente, {
    foreignKey: "cupon_id",
    as: "cupon",
  });

  CanjeCuponCliente.hasMany(PuntoComercioMovimiento, {
    foreignKey: "canje_cupon_id",
    as: "movimientosPuntos",
  });

  PuntoComercioMovimiento.belongsTo(CanjeCuponCliente, {
    foreignKey: "canje_cupon_id",
    as: "canjeCupon",
  });

  ComercioAsociado.hasMany(CanjePremioComercio, {
    foreignKey: "comercio_id",
    as: "canjesPremiosComercio",
  });

  CanjePremioComercio.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

  PremioComercio.hasMany(CanjePremioComercio, {
    foreignKey: "premio_comercio_id",
    as: "canjes",
  });

  CanjePremioComercio.belongsTo(PremioComercio, {
    foreignKey: "premio_comercio_id",
    as: "premio",
  });

  CanjePremioComercio.hasMany(PuntoComercioMovimiento, {
    foreignKey: "canje_premio_comercio_id",
    as: "movimientosPuntos",
  });

  ParticipacionCliente.hasMany(AlertaFraude, {
    foreignKey: "participacion_id",
    as: "alertasFraude",
  });

  AlertaFraude.belongsTo(ParticipacionCliente, {
    foreignKey: "participacion_id",
    as: "participacion",
  });

  ClienteFidelizacion.hasMany(AlertaFraude, {
    foreignKey: "cliente_id",
    as: "alertasFraude",
  });

  AlertaFraude.belongsTo(ClienteFidelizacion, {
    foreignKey: "cliente_id",
    as: "cliente",
  });

  ComercioAsociado.hasMany(AlertaFraude, {
    foreignKey: "comercio_id",
    as: "alertasFraude",
  });

  AlertaFraude.belongsTo(ComercioAsociado, {
    foreignKey: "comercio_id",
    as: "comercio",
  });

};

export {
  ComercioAsociado,
  ComercioQr,
  CampaniaFidelizacion,
  PremioCliente,
  ClienteFidelizacion,
  ParticipacionCliente,
  CuponCliente,
  CanjeCuponCliente,
  PuntoComercioMovimiento,
  PremioComercio,
  CanjePremioComercio,
  AlertaFraude,
  // PremioComercio,
  // CanjePremioComercio,
  // AlertaFraude,
  initFidelizacionAssociations,
};