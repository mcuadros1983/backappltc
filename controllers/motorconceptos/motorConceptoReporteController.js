import motorConceptoReporteService
from "../../services/motorconceptos/motorConceptoReporteService.js";

export const getRegistros = async (
  req,
  res,
  next
) => {

  try {

    const result =
      await motorConceptoReporteService.getRegistros(
        req.user,
        req.query
      );

    return res.status(200).json(result);

  } catch (error) {

    next(error);

  }

};

// export default {

//   getRegistros,

// };