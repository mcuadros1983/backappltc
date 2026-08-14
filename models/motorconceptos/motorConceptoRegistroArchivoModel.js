import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const MotorConceptoRegistroArchivo = sequelize.define(
  "MotorConceptoRegistroArchivo",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    nombre_logico: { type: DataTypes.STRING(180), allowNull: true },
    drive_file_id: { type: DataTypes.STRING(255), allowNull: false },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    mime_type: { type: DataTypes.STRING(150), allowNull: true },
    peso_bytes: { type: DataTypes.BIGINT, allowNull: true },
    hash: { type: DataTypes.STRING(128), allowNull: true },
    url: { type: DataTypes.TEXT, allowNull: true },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    creado_por: { type: DataTypes.INTEGER, allowNull: false },
    modificado_por: { type: DataTypes.INTEGER, allowNull: false },
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "motor_concepto_registros",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    version_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "motor_concepto_registro_versiones",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    archivo_tipo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "motor_concepto_archivo_tipos",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
  },
  {
    tableName: "motor_concepto_registro_archivos",
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ["version_id", "archivo_tipo_id"],
        name: "ix_motor_registro_archivos_tipo",
      },
      {
        fields: ["drive_file_id"],
        name: "ix_motor_registro_archivos_drive_file",
      },
      {
        fields: ["hash"],
        name: "ix_motor_registro_archivos_hash",
      },
      {
        fields: ["nombre_logico"],
        name: "ix_motor_registro_archivos_nombre_logico",
      },
    ],
  }
);

export default MotorConceptoRegistroArchivo;
