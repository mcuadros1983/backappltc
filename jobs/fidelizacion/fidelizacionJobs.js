import { expireCouponsJob } from "./expireCouponsJob.js";
import { finishCampaignsJob } from "./finishCampaignsJob.js";
import { expireCommercePointsJob } from "./expireCommercePointsJob.js";

export const runFidelizacionJobs = async () => {
  console.log("[FIDELIZACION][JOBS] Ejecutando jobs automáticos...");

  const cupones = await expireCouponsJob();
  const campanias = await finishCampaignsJob();
  const puntos = await expireCommercePointsJob();

  return {
    ok: true,
    cupones,
    campanias,
    puntos,
  };
};