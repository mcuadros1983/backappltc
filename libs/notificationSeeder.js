import NotificationEvent from "../models/notification/notificationEventModel.js";


const eventos = [

    {
        codigo: "EVALUACION_ASIGNADA",
        nombre: "Evaluación Asignada",
        categoria: "Evaluación",
        descripcion: "Se asignó una evaluación.",
        activo: true
    },

    {
        codigo: "AUTOEVALUACION_ABIERTA",
        nombre: "Autoevaluación Abierta",
        categoria: "Evaluación",
        descripcion: "Se abrió una autoevaluación.",
        activo: true
    },

    {
        codigo: "AUTOEVALUACION_RECORDATORIO",
        nombre: "Recordatorio de Autoevaluación",
        categoria: "Evaluación",
        descripcion: "Recordatorio antes del vencimiento.",
        activo: true
    },

    {
        codigo: "AUTOEVALUACION_VENCIDA",
        nombre: "Autoevaluación Vencida",
        categoria: "Evaluación",
        descripcion: "La autoevaluación no fue respondida.",
        activo: true
    },

    {
        codigo: "SUPERVISOR_PENDIENTE",
        nombre: "Supervisor Pendiente",
        categoria: "Evaluación",
        descripcion: "El supervisor aún no respondió.",
        activo: true
    },

    {
        codigo: "PARES_PENDIENTES",
        nombre: "Evaluación de Pares Pendiente",
        categoria: "Evaluación",
        descripcion: "Existen evaluaciones de pares pendientes.",
        activo: true
    },

    {
        codigo: "SUBORDINADOS_PENDIENTES",
        nombre: "Evaluación de Subordinados Pendiente",
        categoria: "Evaluación",
        descripcion: "Existen evaluaciones de subordinados pendientes.",
        activo: true
    },

    {
        codigo: "EVALUACION_FINALIZADA",
        nombre: "Evaluación Finalizada",
        categoria: "Evaluación",
        descripcion: "La evaluación fue finalizada.",
        activo: true
    },

    {
        codigo: "RESULTADO_PUBLICADO",
        nombre: "Resultado Publicado",
        categoria: "Evaluación",
        descripcion: "Se publicaron los resultados.",
        activo: true
    },

    {
        codigo: "PLAN_MEJORA_VENCIDO",
        nombre: "Plan de Mejora Vencido",
        categoria: "Evaluación",
        descripcion: "Existe un plan de mejora vencido.",
        activo: true
    }

];

const notificationSeeder = async () => {

    for (const evento of eventos) {

        const existe = await NotificationEvent.findOne({

            where: {

                codigo: evento.codigo

            }

        });

        if (!existe) {

            await NotificationEvent.create(evento);

            console.log(

                `[NotificationSeeder] Evento creado: ${evento.codigo}`

            );

        }

    }

};

export default notificationSeeder;