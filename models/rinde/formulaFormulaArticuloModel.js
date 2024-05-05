import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
import Formula from './formulaModel.js';
import FormulaArticulo from './formulaArticuloModel.js';

const FormulaFormulaArticulo = sequelize.define(
  'formula_formula_articulo',
  {
    formula_id: {
      type: DataTypes.BIGINT,
      // allowNull: false,
      // primaryKey: true,
    },
    formulasarticulos_id: {
      type: DataTypes.BIGINT,
      // allowNull: false,
      // primaryKey: true,
    },
  },
  {
    timestamps: false, // Evita la creación automática de las columnas 'createdAt' y 'updatedAt'
    freezeTableName: true, // Evita que Sequelize pluralice el nombre de la tabla
  }
);

FormulaFormulaArticulo.removeAttribute("id");

// Definir las relaciones
Formula.belongsToMany(FormulaArticulo, {
  through: FormulaFormulaArticulo,
  foreignKey: 'formula_id',
  otherKey: 'formulasarticulos_id',
});

FormulaArticulo.belongsToMany(Formula, {
  through: FormulaFormulaArticulo,
  foreignKey: 'formulasarticulos_id',
  otherKey: 'formula_id',
});

export default FormulaFormulaArticulo;