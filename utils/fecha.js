// utils/fecha.js
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

export const toISODate = (v) => {
  if (!v) return null;
  if (typeof v !== "string") return null;

  const s = v.trim();

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const d = dayjs(s, "DD/MM/YYYY", true);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = dayjs(s, "YYYY-MM-DD", true);
    return d.isValid() ? d.format("YYYY-MM-DD") : null;
  }

  return null;
};

export const toDDMMYYYY = (iso) => {
  if (!iso) return null;
  const d = dayjs(String(iso), "YYYY-MM-DD", true);
  return d.isValid() ? d.format("DD/MM/YYYY") : null;
};
