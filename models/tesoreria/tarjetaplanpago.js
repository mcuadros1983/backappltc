// models/tesoreria/TarjetaPlanPago.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";

const TarjetaPlanPago = sequelize.define("TarjetaPlanPago", {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },

  // Identificación del plan
  nombre: { 
    type: DataTypes.STRING, 
    allowNull: false // Ej: "Ahora 12", "Plan Banco X 6 cuotas"
  },

  // Estructura del plan
  cuotas: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    validate: { min: 1 } 
  },

  // Método de cálculo
  tipo_calculo: {
    type: DataTypes.ENUM("coeficiente", "tasa"),
    allowNull: false,
    defaultValue: "coeficiente"
  },

  coeficiente: { 
    type: DataTypes.DECIMAL(12, 6), 
    allowNull: true // si tipo_calculo = "coeficiente"
  },

  tasa_mensual: { 
    type: DataTypes.DECIMAL(7, 4), 
    allowNull: true // si tipo_calculo = "tasa"
  }

}, {
  timestamps: false,
  freezeTableName: true,
  tableName: "tarjeta_plan_pago"
});

export default TarjetaPlanPago;
