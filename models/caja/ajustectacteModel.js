import { DataTypes } from "sequelize";
import { sequelize } from "../../config/database.js";
import ClienteTabla from "../tablas/clienteModel.js";

const Ajustectacte = sequelize.define(
  "Ajustectacte",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    cliente_id: {
      type: DataTypes.BIGINT,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    importe: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

ClienteTabla.hasOne(Ajustectacte, { foreignKey: 'cliente_id', sourceKey: 'id' });
Ajustectacte.belongsTo(ClienteTabla, { foreignKey: 'cliente_id', targetKey: 'id' }); 

export default Ajustectacte;
