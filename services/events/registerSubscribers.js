import eventService from "./eventService.js";

import notificationSubscriber from "./subscribers/notificationSubscriber.js";
import auditSubscriber from "./subscribers/auditSubscriber.js";
import dashboardSubscriber from "./subscribers/dashboardSubscriber.js";

import evaluacionMailSubscriber
    from "../evaluacion/suscribers/evaluacionMailSubscriber.js";

import evaluacionAnalisisSubscriber
    from "../evaluacion/evaluacionAnalisisSubscriber.js";


export default function registerSubscribers() {

    eventService.subscribe(

        "notification",

        notificationSubscriber

    );

    eventService.subscribe(

        "audit",

        auditSubscriber

    );

    eventService.subscribe(

        "dashboard",

        dashboardSubscriber

    );

    eventService.subscribe(

        "evaluacion-mail",

        evaluacionMailSubscriber

    );

    eventService.subscribe(

        "evaluacion-analisis",

        evaluacionAnalisisSubscriber

    );

}