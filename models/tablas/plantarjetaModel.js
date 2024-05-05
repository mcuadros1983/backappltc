import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const PlanTarjetaTabla = sequelize.define(
  "Plantarjetatabla",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: false, // Desactiva la auto-generación del id
    },
    coeficiente: {
      type: DataTypes.NUMERIC(12, 2),
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    esvale: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    tarjetadecredito_id: {
      type: DataTypes.BIGINT,
      defaultValue: null,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

export default PlanTarjetaTabla;

// coeficiente: "0.00"
// descripcion: "VALE EMPLEADO"
// esvale: true
// id: 3
// tarjetadecredito_id: "3"
