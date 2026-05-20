import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

export class AudioSegmentAnalysis extends Model {}

AudioSegmentAnalysis.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    audio_segment_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },

    had_recommendation: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    had_suggested_sale: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    missed_opportunity: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },

    score_attention: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    score_sales: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    improvement_tip: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    raw_response_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "audio_segment_analysis",
    tableName: "audio_segment_analysis",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["audio_segment_id"],
      },
    ],
  }
);