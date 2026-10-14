import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';
export const ArcaConsultaRecibidos = sequelize.define('ArcaConsultaRecibidos', {
 id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},empresa_id:{type:DataTypes.INTEGER,allowNull:false},cuit:{type:DataTypes.STRING(11),allowNull:false},desde:{type:DataTypes.DATEONLY,allowNull:false},hasta:{type:DataTypes.DATEONLY,allowNull:false},estado:{type:DataTypes.STRING(20),allowNull:false},usuario_id:{type:DataTypes.INTEGER,allowNull:false},consulta_arca:{type:DataTypes.STRING(40)},error:{type:DataTypes.STRING(255)},comprobantes:{type:DataTypes.JSONB,allowNull:true},cantidad:{type:DataTypes.INTEGER},completada_at:{type:DataTypes.DATE}
},{tableName:'arca_consulta_recibidos',indexes:[{fields:['empresa_id','desde','hasta']}]});
export const ArcaMapaConciliacion = sequelize.define('ArcaMapaConciliacion', {
 id:{type:DataTypes.INTEGER,primaryKey:true,autoIncrement:true},clave:{type:DataTypes.STRING(100),unique:true,allowNull:false},tipo_id:{type:DataTypes.INTEGER},letra:{type:DataTypes.STRING(10)},punto_id:{type:DataTypes.INTEGER},codigo:{type:DataTypes.INTEGER,allowNull:false}
},{tableName:'arca_mapa_conciliacion'});
