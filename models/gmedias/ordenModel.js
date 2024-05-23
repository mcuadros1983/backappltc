import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import Producto from "./productoModel.js";


const Orden = sequelize.define("Orden", {  
    peso_total: {
        type: DataTypes.DECIMAL, 
    },
    cantidad_total: {
        type: DataTypes.INTEGER, 
    },
    sucursal_id: {
        type: DataTypes.INTEGER, 
    },
    fecha: {
      type: DataTypes.DATEONLY,
      defaultValue: sequelize.literal('CURRENT_DATE') // Establece la fecha actual por defecto
    }
},
{
  //timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
  freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
})

Orden.hasMany(Producto, {  
    foreignKey: "orden_id", 
    sourceKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
    onDelete: 'SET NULL', // Esta opción establecerá el campo "orden_id" en los registros de productos a nulo al eliminar una orden.
});

Producto.belongsTo(Orden, {
    foreignKey: "orden_id",
    targetKey: "id",
    allowNull: true, // Esta opción indica que la relación no es obligatoria
});

export default Orden;