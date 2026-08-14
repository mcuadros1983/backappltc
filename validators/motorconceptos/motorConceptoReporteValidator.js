import { query } from "express-validator";

// const ESTADOS = [
//   "BORRADOR",
//   "PENDIENTE",
//   "VIGENTE",
//   "VENCIDO",
//   "ANULADO",
// ];
const ESTADOS = [
  "VIGENTE",
  "VENCIDO",
];

const ORDENES = [
  "ASC",
  "DESC",
];

const SORT_FIELDS = [
  "id",
  "concepto_id",
  "entidad_tipo_id",
  "entidad_id",
  "estado",
  "fecha_vencimiento",
  "ultimo_movimiento",
  "sucursal_id",
  "activo",
  "created_at",
  "updated_at",
];

const getRegistros = [

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "page debe ser un entero mayor a cero"
    ),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "limit debe estar entre 1 y 100"
    ),

  query("search")
    .optional()
    .isString()
    .trim(),

  query("concepto_id")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "concepto_id no es válido"
    ),

  query("entidad_tipo_id")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "entidad_tipo_id no es válido"
    ),

  query("entidad_id")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "entidad_id no es válido"
    ),

  query("sucursal_id")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "sucursal_id no es válido"
    ),

  query("estado")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ESTADOS)
    .withMessage(
      "Estado no válido"
    ),

  query("activo")
    .optional()
    .isBoolean()
    .withMessage(
      "activo debe ser true o false"
    ),

  query("fecha_vencimiento_desde")
    .optional()
    .isISO8601()
    .withMessage(
      "fecha_vencimiento_desde no es válida"
    ),

  query("fecha_vencimiento_hasta")
    .optional()
    .isISO8601()
    .withMessage(
      "fecha_vencimiento_hasta no es válida"
    ),

  query("ultimo_movimiento_desde")
    .optional()
    .isISO8601()
    .withMessage(
      "ultimo_movimiento_desde no es válida"
    ),

  query("ultimo_movimiento_hasta")
    .optional()
    .isISO8601()
    .withMessage(
      "ultimo_movimiento_hasta no es válida"
    ),

  query("sort")
    .optional()
    .isIn(SORT_FIELDS)
    .withMessage(
      "Campo de ordenamiento no permitido"
    ),

  query("order")
    .optional()
    .trim()
    .toUpperCase()
    .isIn(ORDENES)
    .withMessage(
      "Orden inválido"
    ),

];

export default {

  getRegistros,

};