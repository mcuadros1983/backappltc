import { runFidelizacionJobs } from "../../jobs/fidelizacion/fidelizacionJobs.js";

export const ejecutarJobsFidelizacionManual = async (req, res) => {
  try {
    const result = await runFidelizacionJobs();

    return res.json({
      ok: true,
      message: "Jobs de fidelización ejecutados correctamente",
      data: result,
    });
  } catch (error) {
    console.error("[ejecutarJobsFidelizacionManual]", error);

    return res.status(500).json({
      ok: false,
      message: "Error al ejecutar jobs de fidelización",
      error: error.message,
    });
  }
};