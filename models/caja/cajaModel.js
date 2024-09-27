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
});



export default Caja; 