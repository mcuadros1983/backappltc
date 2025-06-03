// import { DataTypes } from "sequelize";
// import { sequelize } from "../../config/database.js";

// // Definir el modelo Rinde
// const Rinde = sequelize.define(
//   "Rinde",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     fechaDesde: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     fechaHasta: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     mes: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     anio: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     sucursal_id: {
//       type: DataTypes.BIGINT,
//       allowNull: false,
//     },
//     totalVentas: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalMovimientos: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalMovimientosOtros: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalInventarioInicial: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalInventarioFinal: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     ingresoEsperadoNovillo: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     ingresoEsperadoVaca: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     ingresoEsperadoCerdo: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalKgNovillo: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalKgVaca: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     totalKgCerdo: {
//       type: DataTypes.DECIMAL(12, 2),
//       allowNull: false,
//     },
//     rinde: {
//       type: DataTypes.DECIMAL(10, 2), // Dos decimales para el porcentaje
//       allowNull: false,
//     },
//   },
//   {
//     // Opciones del modelo
//     freezeTableName: true,
//     timestamps: true, // Para añadir los campos createdAt y updatedAt automáticamente
//   }
// );

// export default Rinde;

import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const Rinde = sequelize.define(
  "Rinde",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fechaDesde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaHasta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    mes: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    totalVentas: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalMovimientos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalMovimientosOtros: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalInventarioInicial: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalInventarioFinal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoNovillo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoVaca: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ingresoEsperadoCerdo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgNovillo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgVaca: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    totalKgCerdo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    rinde: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    // Campos nuevos
    cantidadMedias: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    totalKg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    mbcerdo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    costoprom: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    mgtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    mgporkg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    promdiario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    totalventa: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    gastos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    cajagrande: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    otros: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    costovacuno: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    achuras: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    difInventario: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    costoporcino: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    ingEsperado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    ingVendido: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    difEsperado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    difVendido: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    valorRinde: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    eficiencia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

export default Rinde;
