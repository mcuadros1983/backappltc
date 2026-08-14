import express from "express";

import {

    obtenerConfiguracion,
    guardarConfiguracion,
    probarConexion

} from "../../controllers/notification/notificationConfigController.js";

import {

    listarPlantillas,
    obtenerPlantilla,
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla

} from "../../controllers/notification/notificationTemplateController.js";

import {

    enviarNotificacion,
    listarHistorial,
    obtenerHistorial

} from "../../controllers/notification/notificationController.js";

import {

    listarEventos,
    obtenerEvento,
    crearEvento,
    actualizarEvento,
    eliminarEvento

} from "../../controllers/notification/notificationEventController.js";


import {

    listarDestinatarios,
    obtenerDestinatario,
    crearDestinatario,
    actualizarDestinatario,
    eliminarDestinatario

} from "../../controllers/notification/notificationRecipientController.js";


const router = express.Router();

/*=========================================================
  CONFIGURACIÓN SMTP
=========================================================*/

router.get(

    "/config",

    obtenerConfiguracion

);

router.put(

    "/config",

    guardarConfiguracion

);

router.post(

    "/config/test",

    probarConexion

);

/*=========================================================
  PLANTILLAS
=========================================================*/

router.get(

    "/templates",

    listarPlantillas

);

router.get(

    "/templates/:id",

    obtenerPlantilla

);

router.post(

    "/templates",

    crearPlantilla

);

router.put(

    "/templates/:id",

    actualizarPlantilla

);

router.delete(

    "/templates/:id",

    eliminarPlantilla

);

/*=========================================================
  NOTIFICACIONES
=========================================================*/

router.post(

    "/send",

    enviarNotificacion

);

router.get(

    "/history",

    listarHistorial

);

router.get(

    "/history/:id",

    obtenerHistorial

);

/*=========================================================
  EVENTOS
=========================================================*/

router.get(

    "/events",

    listarEventos

);

router.get(

    "/events/:id",

    obtenerEvento

);

router.post(

    "/events",

    crearEvento

);

router.put(

    "/events/:id",

    actualizarEvento

);

router.delete(

    "/events/:id",

    eliminarEvento

);

/*=========================================================
  DESTINATARIOS
=========================================================*/

router.get(

    "/recipients",

    listarDestinatarios

);

router.get(

    "/recipients/:id",

    obtenerDestinatario

);

router.post(

    "/recipients",

    crearDestinatario

);

router.put(

    "/recipients/:id",

    actualizarDestinatario

);

router.delete(

    "/recipients/:id",

    eliminarDestinatario

);

export default router;