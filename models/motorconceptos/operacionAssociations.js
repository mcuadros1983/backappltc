import {
  MotorConcepto,
  MotorConceptoEntidadTipo,
  MotorConceptoCampo,
  MotorConceptoArchivoTipo,
  // MotorConceptoEntidadTipoRel,
  MotorConceptoRegistro,
} from "./index.js";

// import MotorConceptoRegistro from "./motorConceptoRegistroModel.js";
import MotorConceptoRegistroVersion from "./motorConceptoRegistroVersionModel.js";
import MotorConceptoRegistroValor from "./motorConceptoRegistroValorModel.js";
import MotorConceptoRegistroArchivo from "./motorConceptoRegistroArchivoModel.js";

import MotorConceptoEntidadAsignacion
  from "./motorConceptoEntidadAsignacionModel.js";

export const initMotorConceptosOperacionAssociations = () => {

  // MotorConcepto.belongsToMany(
  //   MotorConceptoEntidadTipo,
  //   {
  //     through: MotorConceptoEntidadTipoRel,
  //     foreignKey: "concepto_id",
  //     otherKey: "entidad_tipo_id",
  //     as: "entidadesTipos",
  //   }
  // );

  // MotorConceptoEntidadTipo.belongsToMany(
  //   MotorConcepto,
  //   {
  //     through: MotorConceptoEntidadTipoRel,
  //     foreignKey: "entidad_tipo_id",
  //     otherKey: "concepto_id",
  //     as: "conceptos",
  //   }
  // );


  MotorConcepto.hasMany(MotorConceptoRegistro, {
    foreignKey: "concepto_id",
    as: "registros",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistro.belongsTo(MotorConcepto, {
    foreignKey: "concepto_id",
    as: "concepto",
  });

  MotorConceptoEntidadTipo.hasMany(MotorConceptoRegistro, {
    foreignKey: "entidad_tipo_id",
    as: "registros",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistro.belongsTo(MotorConceptoEntidadTipo, {
    foreignKey: "entidad_tipo_id",
    as: "entidadTipo",
  });

  MotorConceptoRegistro.hasMany(MotorConceptoRegistroVersion, {
    foreignKey: "registro_id",
    as: "versiones",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistroVersion.belongsTo(MotorConceptoRegistro, {
    foreignKey: "registro_id",
    as: "registro",
  });

  MotorConceptoRegistro.belongsTo(MotorConceptoRegistroVersion, {
    foreignKey: "version_actual_id",
    as: "versionActual",
    constraints: false,
  });

  MotorConceptoRegistroVersion.hasMany(MotorConceptoRegistroValor, {
    foreignKey: "version_id",
    as: "valores",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistroValor.belongsTo(MotorConceptoRegistroVersion, {
    foreignKey: "version_id",
    as: "version",
  });

  MotorConceptoCampo.hasMany(MotorConceptoRegistroValor, {
    foreignKey: "campo_id",
    as: "valores",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistroValor.belongsTo(MotorConceptoCampo, {
    foreignKey: "campo_id",
    as: "campo",
  });

  MotorConceptoRegistroVersion.hasMany(MotorConceptoRegistroArchivo, {
    foreignKey: "version_id",
    as: "archivos",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistroArchivo.belongsTo(MotorConceptoRegistroVersion, {
    foreignKey: "version_id",
    as: "version",
  });

  MotorConceptoArchivoTipo.hasMany(MotorConceptoRegistroArchivo, {
    foreignKey: "archivo_tipo_id",
    as: "archivos",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  });

  MotorConceptoRegistroArchivo.belongsTo(MotorConceptoArchivoTipo, {
    foreignKey: "archivo_tipo_id",
    as: "archivoTipo",
  });

  MotorConcepto.hasMany(
  MotorConceptoEntidadAsignacion,
  {
    foreignKey: "concepto_id",
    as: "asignaciones",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  }
);

MotorConceptoEntidadAsignacion.belongsTo(
  MotorConcepto,
  {
    foreignKey: "concepto_id",
    as: "concepto",
  }
);

MotorConceptoEntidadTipo.hasMany(
  MotorConceptoEntidadAsignacion,
  {
    foreignKey: "entidad_tipo_id",
    as: "asignaciones",
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  }
);

MotorConceptoEntidadAsignacion.belongsTo(
  MotorConceptoEntidadTipo,
  {
    foreignKey: "entidad_tipo_id",
    as: "entidadTipo",
  }
);

MotorConceptoRegistro.hasMany(
  MotorConceptoEntidadAsignacion,
  {
    foreignKey: "registro_actual_id",
    as: "asignaciones",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  }
);

MotorConceptoEntidadAsignacion.belongsTo(
  MotorConceptoRegistro,
  {
    foreignKey: "registro_actual_id",
    as: "registroActual",
  }
);


};

export {
  MotorConceptoRegistro,
  MotorConceptoRegistroVersion,
  MotorConceptoRegistroValor,
  MotorConceptoRegistroArchivo,
  MotorConceptoEntidadAsignacion,
  MotorConceptoEntidadTipo,
  MotorConceptoCampo,
  MotorConceptoArchivoTipo,


  // MotorConceptoRegistro
};
