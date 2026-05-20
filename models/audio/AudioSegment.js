import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

export class AudioSegment extends Model {}

AudioSegment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    segment_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    sucursal_codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at_local: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sample_rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    transcription_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "not_available",
    },
    transcription_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transcription_engine: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    transcription_model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    transcription_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    has_text: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    has_recommendation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    has_offer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    has_suggested_sale: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    has_question: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    classification_confidence: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    classification_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    metadata_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    analysis_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "audio_segment",
    tableName: "audio_segment",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["segment_id"] },
      { fields: ["sucursal_codigo"] },
      { fields: ["fecha"] },
      { fields: ["analysis_status"] },
      { fields: ["has_question"] },
      { fields: ["has_recommendation"] },
      { fields: ["has_suggested_sale"] },
    ],
  }
);