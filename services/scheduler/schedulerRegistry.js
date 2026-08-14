/*=========================================================
  SCHEDULER REGISTRY
=========================================================*/

class SchedulerRegistry {

    constructor() {

        this.jobs = new Map();

    }

    register(codigo, job) {

        this.jobs.set(codigo, job);

    }

    get(codigo) {

        return this.jobs.get(codigo);

    }

    has(codigo) {

        return this.jobs.has(codigo);

    }

    all() {

        return this.jobs;

    }

}

export default new SchedulerRegistry();