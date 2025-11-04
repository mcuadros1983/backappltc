// server/models/ProyeccionResultado.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const ProyeccionResultado = sequelize.define(
  "ProyeccionResultado",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // fecha proyectada (el día al que corresponde la venta estimada)
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

     // 🔹 NUEVO: guardamos el nombre de la sucursal en el momento del cálculo
    sucursal_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    proyeccion_base: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },

    proyeccion_final: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // JSON con los multiplicadores que se aplicaron:
    // [
    //   { tipo: "factor_general", nombre: "Finde 1-14", factor: 1.3 },
    //   { tipo: "feriado", descripcion: "Feriado turismo", factor: 1.05 }
    // ]
    ajustes_aplicados: {
      type: DataTypes.JSONB, // si usás Postgres: JSONB. Si no, DataTypes.JSON.
      allowNull: false,
      defaultValue: [],
    },

    // para agrupar una corrida completa del usuario
    lote_calculo_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "proyeccion_resultados",
    timestamps: true,
  }
);

export default ProyeccionResultado;
