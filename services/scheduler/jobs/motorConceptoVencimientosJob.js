import motorConceptoRegistroService
  from "../../motorconceptos/motorConceptoRegistroService.js";

const execute = async () => {

  return await motorConceptoRegistroService
    .markExpired();

};

export default {
  execute,
};