import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

// TIP: si tus tablas usan snake_case en DB, activá underscored: true
const CompraProyectada = sequelize.define(
  "CompraProyectada",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    empresa_id:        { type: DataTypes.INTEGER, allowNull: false },
    libroiva_id:       { type: DataTypes.INTEGER, allowNull: false },
    periodo_id:        { type: DataTypes.INTEGER, allowNull: false },
    proveedor_id:      { type: DataTypes.INTEGER, allowNull: false },

    fecha:             { type: DataTypes.DATEONLY, allowNull: false },

    // marcada como "informada" cuando ya se declaró/cargó efectivamente
    informada:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    // cantidades / montos
    cantidad:          { type: DataTypes.DECIMAL(14, 2), allowNull: true }, // p.ej. unidades
    kg:                { type: DataTypes.DECIMAL(14, 2), allowNull: true }, // si aplica a carnes/insumos al peso
    precio:            { type: DataTypes.DECIMAL(14, 2), allowNull: true }, // precio unitario

    // totales
    bruto:             { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    iva:               { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    neto:              { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "compra_proyectada",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["empresa_id"] },
      { fields: ["libroiva_id"] },
      { fields: ["periodo_id"] },
      { fields: ["proveedor_id"] },
      { fields: ["fecha"] },
      // evita duplicados típicos en un mismo período/proveedor/fecha
      { unique: false, fields: ["empresa_id", "periodo_id", "proveedor_id", "fecha"] },
    ],
  }
);

// Associations (ajusta a tus modelos reales)
import Empresa from "../comun/empresa.js";
import LibroIva from "../iva/libroiva.js";
import PeriodoLiquidacion from "../sueldoempleado/periodoliquidacion.js"; // o donde lo tengas
import Proveedor from "../comun/proveedor.js";

CompraProyectada.belongsTo(Empresa, { foreignKey: "empresa_id", as: "empresa" });
CompraProyectada.belongsTo(LibroIva, { foreignKey: "libroiva_id", as: "libroiva" });
CompraProyectada.belongsTo(PeriodoLiquidacion, { foreignKey: "periodo_id", as: "periodo" });
CompraProyectada.belongsTo(Proveedor, { foreignKey: "proveedor_id", as: "proveedor" });

export default CompraProyectada;
