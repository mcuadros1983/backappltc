// import { DataTypes } from 'sequelize';
// import {sequelize} from '../config/database.js';
// import Producto from './productoModel.js';
// // import {Venta} from './ventaModel.js';
// // import Producto from './productoModel.js';

// const DetalleVenta = sequelize.define('DetalleVenta', {   
//   cantidad: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//   },
//   precioUnitario: {
//     type: DataTypes.FLOAT,
//     allowNull: false,
//   }, 
//   // producto_id: {
//   //   type: DataTypes.INTEGER,
//   //   allowNull: true,
//   // },
//   // Otros campos del detalle de venta, si los necesitas
// });

// // Definir relaciones
// // DetalleVenta.belongsTo(Venta, { foreignKey: 'ventaId' });
// // DetalleVenta.belongsTo(Producto, { foreignKey: 'productoId' });
// DetalleVenta.hasMany(Producto, { 
//   foreignKey: "detalleVenta_id",
//   sourceKey: "id",
//   as:"productos",
//   allowNull: true, // Esta opción indica que la relación no es obligatoria
// });

// Producto.belongsTo(DetalleVenta, {
//   foreignKey: "detalleVenta_id",
//   targetKey: "id",
//   allowNull: true, // Esta opción indica que la relación no es obligatoria
// });

// export default DetalleVenta;  