import MotorConcepto from "./motorConceptoModel.js";
import MotorConceptoEntidadTipo from "./motorConceptoEntidadTipoModel.js";
import MotorConceptoEntidad from "./motorConceptoEntidadModel.js";
import MotorConceptoCampo from "./motorConceptoCampoModel.js";
import MotorConceptoLista from "./motorConceptoListaModel.js";
import MotorConceptoListaItem from "./motorConceptoListaItemModel.js";
import MotorConceptoArchivoTipo from "./motorConceptoArchivoTipoModel.js";
import MotorConceptoRegla from "./motorConceptoReglaModel.js";
// import MotorConceptoEntidadTipoRel from "./motorConceptoEntidadTipoRelModel.js";
import MotorConceptoRegistro from "./motorConceptoRegistroModel.js";


export const initMotorConceptosAssociations = () => {
  MotorConcepto.hasMany(MotorConceptoEntidad, {
    foreignKey: "concepto_id",
    as: "entidades",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoEntidad.belongsTo(MotorConcepto, {
    foreignKey: "concepto_id",
    as: "concepto",
  });

  MotorConceptoEntidadTipo.hasMany(MotorConceptoEntidad, {
    foreignKey: "entidad_tipo_id",
    as: "conceptos",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });
  MotorConceptoEntidad.belongsTo(MotorConceptoEntidadTipo, {
    foreignKey: "entidad_tipo_id",
    as: "entidadTipo",
    // as: "entidades",
  });

  MotorConcepto.hasMany(MotorConceptoCampo, {
    foreignKey: "concepto_id",
    as: "campos",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoCampo.belongsTo(MotorConcepto, {
    foreignKey: "concepto_id",
    as: "concepto",
  });

  MotorConceptoCampo.hasOne(MotorConceptoLista, {
    foreignKey: "campo_id",
    as: "lista",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoLista.belongsTo(MotorConceptoCampo, {
    foreignKey: "campo_id",
    as: "campo",
  });

  MotorConceptoLista.hasMany(MotorConceptoListaItem, {
    foreignKey: "lista_id",
    as: "items",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoListaItem.belongsTo(MotorConceptoLista, {
    foreignKey: "lista_id",
    as: "lista",
  });

  MotorConcepto.hasMany(MotorConceptoArchivoTipo, {
    foreignKey: "concepto_id",
    as: "archivosTipos",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoArchivoTipo.belongsTo(MotorConcepto, {
    foreignKey: "concepto_id",
    as: "concepto",
  });

  MotorConcepto.hasMany(MotorConceptoRegla, {
    foreignKey: "concepto_id",
    as: "reglas",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoRegla.belongsTo(MotorConcepto, {
    foreignKey: "concepto_id",
    as: "concepto",
  });

  MotorConceptoCampo.hasMany(MotorConceptoRegla, {
    foreignKey: "campo_destino_id",
    as: "reglasDestino",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoRegla.belongsTo(MotorConceptoCampo, {
    foreignKey: "campo_destino_id",
    as: "campoDestino",
  });

  MotorConceptoCampo.hasMany(MotorConceptoRegla, {
    foreignKey: "campo_origen_id",
    as: "reglasOrigen",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });
  MotorConceptoRegla.belongsTo(MotorConceptoCampo, {
    foreignKey: "campo_origen_id",
    as: "campoOrigen",
  });
};

export {
  MotorConcepto,
  MotorConceptoEntidadTipo,
  MotorConceptoEntidad,
  MotorConceptoCampo,
  MotorConceptoLista,
  MotorConceptoListaItem,
  MotorConceptoArchivoTipo,
  MotorConceptoRegla,
  // MotorConceptoEntidadTipoRel,
  MotorConceptoRegistro
};
