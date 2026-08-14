import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

import InteligenciaSnapshot from "./inteligenciaSnapshotModel.js";

const InteligenciaPromocionHistorico = sequelize.define(
  "InteligenciaPromocionHistorico",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },

    snapshot_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    promocion_origen_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    tipo_promocion: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    fecha_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    aplica_todos: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    prioridad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    articulos: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },

    dias_semana: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: "inteligencia_promociones_historicas",
    timestamps: false,
    indexes: [
      {
        fields: ["snapshot_id"],
      },
      {
        fields: ["fecha_desde", "fecha_hasta"],
      },
    ],
  }
);
InteligenciaPromocionHistorico.belongsTo(
  InteligenciaSnapshot,
  {
    foreignKey: "snapshot_id",
    as: "snapshot",
    onDelete: "CASCADE",
  }
);

InteligenciaSnapshot.hasMany(
  InteligenciaPromocionHistorico,
  {
    foreignKey: "snapshot_id",
    as: "promociones",
    onDelete: "CASCADE",
  }
);

export default InteligenciaPromocionHistorico;