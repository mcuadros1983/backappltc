// models/documentacion/DocumentoPaso.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../config/database.js";

class DocumentoPaso extends Model {}

DocumentoPaso.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    documento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    titulo_paso: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    detalle_paso: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },

    responsable: {
      // ejemplo: "Cajero", "Supervisor", "Mantenimiento"
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    requiere_foto: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "DocumentoPaso",
    tableName: "documento_paso",
    timestamps: false,
    freezeTableName: true,
  }
);

export default DocumentoPaso;
