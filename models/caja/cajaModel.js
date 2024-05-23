import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Cobranzactacte from "./cobranzactacteModel.js";
import Cupon from "./cuponModel.js";
import Gasto from "./gastoModel.js";
import Ingreso from "./ingresoModel.js";
import Retiro from "./retiroModel.js";
import Sueldo from "./sueldoModel.js";
import Vale from "./valeModel.js";
import Vtactacte from "./vtactacteModel.js";
// Importa aquí los modelos relacionados si es necesario

const Caja = sequelize.define("Caja", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  cajaId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  sucursal_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  cajafinal: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
  },
  cajainicial: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
  },
  fechafin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fechainicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
}, {
  timestamps: false,
  freezeTableName: true,
  // indexes: [
  //   {
  //     unique: true,
  //     fields: ['cajaId', 'sucursal_id'] // Clave compuesta para asegurar la unicidad dentro de una sucursal
  //   }
  // ]
});

// Relación con Cupon
// Cupon.belongsTo(Caja, {
//   as:"Caja",
//   foreignKey: 'caja_id',
//   targetKey: 'cajaId',
//   constraints: false
// });

// Asegúrate de que en `Caja` se define una relación recíproca si es necesario
// Caja.hasMany(Cupon, {
//   as:"Cupon",
//   foreignKey: 'caja_id',
//   sourceKey: 'cajaId',
//   constraints: false
// });

// Asocia aquí los modelos relacionados si es necesario

// Cupon.belongsTo(Caja, {
//   as:"Cupon",
//   foreignKey: "caja_id",
//   targetKey:"cajaId",
// });

// Cobranzactacte.belongsTo(Caja, {
//   as:"Cobranzactacte",
//   foreignKey: "caja_id",
// });
// Cupon.belongsTo(Caja, {
// Gasto.belongsTo(Caja, {
//   as:"Gasto",
//   foreignKey: "caja_id",
// });
// Ingreso.belongsTo(Caja, {
//   foreignKey: "caja_id",
// });
// Retiro.belongsTo(Caja, {
//   as:"Retiro",
//   foreignKey: "caja_id",
// });
// Sueldo.belongsTo(Caja, {
//   as:"Sueldo",
//   foreignKey: "caja_id",
// });
// Vale.belongsTo(Caja, {
//   foreignKey: "caja_id",
// });
// Vtactacte.belongsTo(Caja, {
//   as:"Vtactacte",
//   foreignKey: "caja_id",
// });


export default Caja; 