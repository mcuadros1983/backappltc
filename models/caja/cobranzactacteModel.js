import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ClienteTabla from "../tablas/clienteModel.js";
// import Caja from "./cajaModel.js";
// import Vtactacte from "./vtactacteModel.js";
// import ClienteTabla from "../tablas/clienteModel.js";

const Cobranzactacte = sequelize.define(  
  "Cobranzactacte",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cobranzaId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    caja_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    dtype: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    importe: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    saldocobranza: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },
    sucursal_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    // tableName: "cobranzanctacte",
    timestamps: false,
    freezeTableName: true,
  }
);

// Asociación en el modelo Cobranzactacte
// Cobranzactacte.belongsTo(ClienteTabla, { foreignKey: 'cliente_id' }); 

ClienteTabla.hasOne(Cobranzactacte, { foreignKey: 'cliente_id', sourceKey: 'id' });
Cobranzactacte.belongsTo(ClienteTabla, { foreignKey: 'cliente_id', targetKey: 'id' });


export default Cobranzactacte; 
