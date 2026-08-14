/*=========================================================
  EVENT DISPATCHER
=========================================================*/

class EventDispatcher {

    constructor() {

        this.subscribers = new Map();

    }

    subscribe(nombre, subscriber) {

        this.subscribers.set(

            nombre,

            subscriber

        );

    }

    unsubscribe(nombre) {

        this.subscribers.delete(

            nombre

        );

    }

    async dispatch(evento) {

        for (

            const subscriber

            of this.subscribers.values()

        ) {

            if (

                typeof subscriber.process === "function"

            ) {

                await subscriber.process(

                    evento

                );

            }

        }

    }

}

export default new EventDispatcher();