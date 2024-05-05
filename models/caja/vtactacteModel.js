import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ClienteTabla from "../tablas/clienteModel.js";
// import Cobranzactacte from "./cobranzactacteModel.js";
// import ClienteTabla from "../tablas/clienteModel.js";

const Vtactacte = sequelize.define( 
  "Vtactacte",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true
    },
    vtactacteId: {
      type: DataTypes.BIGINT,
    },
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    importe: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    saldo: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    venta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    // tableName: "Vtactacte",
    timestamps: false,
    freezeTableName: true,
  }
);

// Vtactacte.belongsTo(ClienteTabla, { foreignKey: 'cliente_id' }); 

ClienteTabla.hasOne(Vtactacte, { foreignKey: 'cliente_id', sourceKey: 'id' });
Vtactacte.belongsTo(ClienteTabla, { foreignKey: 'cliente_id', targetKey: 'id' }); 

// CajaMovimiento.belongsTo(MovimientoCaja, { foreignKey: "movimientoscaja_id" });
// CajaMovimiento.belongsTo(MovimientoCajaGasto, {
//   foreignKey: "movimientoscaja_id",
// });

export default Vtactacte;
