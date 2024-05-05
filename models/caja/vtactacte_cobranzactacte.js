// import { DataTypes } from "sequelize";
// import { sequelize } from "../../config/database.js";
// import Vtactacte from "./vtactacteModel.js";
// import Cobranzactacte from "./cobranzactacteModel.js";

// const VtaCtaCteCobranzaCtaCte = sequelize.define(
//   "Vtactacte_cobranzactacte",
//   {
//     vtactacte_id: {
//       type: DataTypes.BIGINT,
//       primaryKey: true,
//     },
//     cobranzactacte_id: {
//       type: DataTypes.BIGINT,
//       primaryKey: true,
//     },
//   },
//   {
//     // tableName: "cobranzanctacte",
//     timestamps: false,
//     freezeTableName: true,
//   }
// );

// // VtaCtaCteCobranzaCtaCte.belongsTo(Vtactacte, {
// //   foreignKey: "vtactacte_id",
// // });
// // VtaCtaCteCobranzaCtaCte.belongsTo(Cobranzactacte, {
// //   foreignKey: "cobranzactacte_id",
// // });

// // Vtactacte.belongsToMany(Cobranzactacte, {
// //   through: VtaCtaCteCobranzaCtaCte,
// //   foreignKey: "vtactacte_id",
// //   otherKey: "cobranzactacte_id",
// // });

// // Cobranzactacte.belongsToMany(Vtactacte, {
// //   through: VtaCtaCteCobranzaCtaCte,
// //   foreignKey: "cobranzactacte_id",
// //   otherKey: "vtactacte_id",
// // });


// export default VtaCtaCteCobranzaCtaCte;
