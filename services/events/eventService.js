import eventDispatcher from "./eventDispatcher.js";
import eventRegistry from "./eventRegistry.js";
import eventValidator from "./eventValidator.js";

/*=========================================================
  PUBLICAR EVENTO
=========================================================*/

const publish = async (

    evento

) => {

    await eventRegistry.validate(

        evento.codigo

    );

    if (

        !evento.fecha

    ) {

        evento.fecha =

            new Date();

    }

    eventValidator.validate(

        evento

    );

    await eventDispatcher.dispatch(

        evento

    );

};

/*=========================================================
  REGISTRAR SUBSCRIPTOR
=========================================================*/

const subscribe = (

    nombre,

    subscriber

) => {

    eventDispatcher.subscribe(

        nombre,

        subscriber

    );

};

/*=========================================================
  ELIMINAR SUBSCRIPTOR
=========================================================*/

const unsubscribe = (

    nombre

) => {

    eventDispatcher.unsubscribe(

        nombre

    );

};

export default {

    publish,

    subscribe,

    unsubscribe

};