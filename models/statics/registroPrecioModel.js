// server/models/precios/registroPrecio.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

/**
 * Registro de precios históricos por artículo/código de barras/fecha
 * - precio: DECIMAL(12,2)
 * - articulo_id: INTEGER (FK al artículo si lo tenés)
 * - codigobarra: STRING (permite trackear por EAN/UPC)
 * - fecha: DATEONLY (aaaa-mm-dd)
 *
 * NOTA: El índice único compuesto evita duplicar el precio para el mismo
 * (articulo_id, codigobarra, fecha). Si NO querés unicidad, quitá el unique.
 */
const RegistroPrecio = sequelize.define(
  "RegistroPrecio",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    precio: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0
      }
    },

    articulo_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // ponelo en false si es obligatorio en tu app
      validate: { isInt: true }
    },

    codigobarra: {
      type: DataTypes.STRING(64),
      allowNull: true, // ponelo en false si lo vas a exigir
      // si querés que siempre haya al menos uno de los dos (articulo_id o codigobarra),
      // validalo a nivel controller/servicio.
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW, // guarda YYYY-MM-DD actual
      validate: {
        isDate: true
      }
    }
  },
  {
    tableName: "RegistroPrecio",
    timestamps: false,
    indexes: [
      // Búsquedas típicas
      { fields: ["articulo_id"] },
      { fields: ["codigobarra"] },
      { fields: ["fecha"] },
      // Evitar duplicados por día para el mismo artículo/código
      {
        unique: true,
        fields: ["articulo_id", "codigobarra", "fecha"]
      }
    ]
  }
);

export default RegistroPrecio;