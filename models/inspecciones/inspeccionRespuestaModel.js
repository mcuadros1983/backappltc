import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const InspeccionRespuesta = sequelize.define(
  "InspeccionRespuesta",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    inspeccion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    categoria_nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    resultado: {
      type: DataTypes.ENUM(
        "CUMPLE",
        "NO_CUMPLE",
        "NO_APLICA"
      ),
      allowNull: true,
    },

    comentario_admin: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    comentario_sucursal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    usuario_corrector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    usuario_revisor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    requiere_accion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    requiere_foto: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    criticidad_observacion: {
      type: DataTypes.ENUM(
        "BAJA",
        "MEDIA",
        "ALTA",
        "CRITICA"
      ),
      defaultValue: "MEDIA",
    },

    estado: {
      type: DataTypes.ENUM(
        "PENDIENTE",
        "EN_TRABAJO",
        "EN_REVISION",
        "APROBADA",
        "RECHAZADA",
        "REABIERTA",
        "CERRADA"
      ),
      defaultValue: "PENDIENTE",
    },

    fecha_limite: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    fecha_compromiso_sucursal: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    fecha_respuesta_sucursal: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    fecha_inicio_trabajo: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    dias_resolucion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    dias_objetivo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    vencida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Snapshot del item inspeccionado
    descripcion_item: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    peso_item: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    tipo_respuesta_item: {
      type: DataTypes.ENUM(
        "CHECK",
        "SI_NO",
        "NUMERICO",
        "TEXTO"
      ),
      defaultValue: "SI_NO",
    },

    criticidad_item: {
      type: DataTypes.ENUM(
        "BAJA",
        "MEDIA",
        "ALTA",
        "CRITICA"
      ),
      defaultValue: "MEDIA",
    },

    usuario_inspector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

  },
  {
    timestamps: true,
  }
);

export default InspeccionRespuesta;