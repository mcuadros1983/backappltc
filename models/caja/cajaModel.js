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

const Caja = sequelize.define(
  "Caja",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    cajaId: {
      type: DataTypes.BIGINT,
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
      type: DataTypes.DATE,
      allowNull: false,
    },
    fechainicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

// Asocia aquí los modelos relacionados si es necesario

Caja.belongsTo(Cobranzactacte, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Cupon, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Gasto, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Ingreso, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Retiro, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Sueldo, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Vale, {
  foreignKey: "caja_id",
});
Caja.belongsTo(Vtactacte, {
  foreignKey: "caja_id",
});


export default Caja;
