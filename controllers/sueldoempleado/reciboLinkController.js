import crypto from "crypto";

function signPath(basePathWithQuery, secret) {
  return crypto.createHmac("sha256", secret).update(basePathWithQuery).digest("hex");
}
function buildSignedPath(path, ttlSeconds, secret) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const base = `${path}?exp=${exp}`;
  const sig = signPath(base, secret);
  return { signedPath: `${base}&sig=${sig}`, exp };
}

/**
 * POST /links/recibo/:id
 * body: { ttlSeconds?: number, format?: "html" | "pdf" }
 * -> { url, expIn }
 *
 * Por DEFECTO devuelve link a HTML estilado (más simple y mantiene estilos).
 */
export async function createLinkFirmadoRecibo(req, res) {
  try {
    const secret = process.env.PDF_SIGN_SECRET;
    if (!secret) return res.status(500).json({ error: "Falta PDF_SIGN_SECRET" });

    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido" });

    const ttl = Number(req.body?.ttlSeconds) || Number(process.env.PDF_LINK_TTL_SECONDS) || (72 * 3600);
    const format = (req.body?.format || "html").toLowerCase();

    const path = format === "pdf"
      ? `/public/recibo/${id}.pdf`
      : `/public/recibo/${id}`; // HTML por defecto

    const { signedPath } = buildSignedPath(path, ttl, secret);

    const base = (process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
    return res.json({ url: `${base}${signedPath}`, expIn: ttl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo generar el link." });
  }
}
