// services/googleDriveService.js
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cargar credenciales JSON de la service account
const serviceAccountPath = path.join(
  __dirname,
  "../config/gdrive-service-account.json"
);
console.log("📁 [Drive] Leyendo credenciales desde:", serviceAccountPath);

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ [Drive] No se encontró el archivo de credenciales.");
  throw new Error(
    "gdrive-service-account.json no encontrado en /server/config/"
  );
}

let serviceAccountRaw;
try {
  serviceAccountRaw = fs.readFileSync(serviceAccountPath, "utf8");
} catch (readErr) {
  console.error("❌ [Drive] Error leyendo el archivo de credenciales:", readErr);
  throw readErr;
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountRaw);
} catch (parseErr) {
  console.error("❌ [Drive] Error parseando JSON de credenciales:", parseErr);
  throw parseErr;
}

// LOGS DE CONTROL (no imprimimos la key completa)
console.log("🔑 [Drive] client_email:", serviceAccount.client_email);
console.log("🔑 [Drive] project_id:", serviceAccount.project_id);
if (!serviceAccount.private_key) {
  console.error(
    "❌ [Drive] private_key está undefined o vacía. El JSON NO es una service account válida o está corrupto."
  );
} else {
  console.log(
    "🔐 [Drive] private_key length:",
    serviceAccount.private_key.length,
    "starts with:",
    serviceAccount.private_key.slice(0, 30)
  );
}

// carpeta destino en Drive
const DRIVE_PARENT_FOLDER_ID = process.env.DRIVE_PARENT_FOLDER_ID;
console.log(
  "📂 [Drive] DRIVE_PARENT_FOLDER_ID:",
  DRIVE_PARENT_FOLDER_ID || "(no seteado, se subirá a raíz de la cuenta de servicio)"
);

// 2. Crear auth JWT con la service account
const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

// 3. Cliente de la API Drive
const drive = google.drive({ version: "v3", auth });

// 4. Función para subir al Drive
export async function uploadToDrive({ originalName, mimeType, localPath }) {
  console.log("🚀 [Drive] Iniciando upload...");
  console.log("   📄 originalName:", originalName);
  console.log("   📄 mimeType:", mimeType);
  console.log("   📄 localPath:", localPath);

  try {
    console.log("🔐 [Drive] Pidiendo token (auth.authorize())...");
    const tokenInfo = await auth.authorize();
    console.log(
      "✅ [Drive] Token OK. Expira:",
      tokenInfo?.expiry_date
        ? new Date(tokenInfo.expiry_date).toLocaleString()
        : "(sin expiry_date)"
    );

    // metadata del archivo en Drive
    const fileMetadata = {
      name: originalName,
      ...(DRIVE_PARENT_FOLDER_ID
        ? { parents: [DRIVE_PARENT_FOLDER_ID] }
        : {}),
    };

    // stream binario del archivo temporal
    const media = {
      mimeType,
      body: fs.createReadStream(localPath),
    };

    console.log("⬆ [Drive] Subiendo archivo a Drive.files.create()...");
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, webViewLink, webContentLink",
    });

    console.log("✅ [Drive] Subida exitosa. Respuesta:");
    console.log(response.data);

    const fileId = response.data.id;

    console.log(
      "🌍 [Drive] Haciendo público el archivo (anyone with the link puede leer)..."
    );
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const resultado = {
      fileId,
      webViewLink: response.data.webViewLink || "",
      webContentLink: response.data.webContentLink || "",
    };

    console.log("🎯 [Drive] Todo OK. Resultado final:", resultado);
    return resultado;
  } catch (error) {
    console.error("❌ [Drive] Error en uploadToDrive()");
    console.error("   message:", error.message);
    console.error("   code:", error.code || "N/A");
    console.error("   status:", error.status || "N/A");

    if (error.response?.data) {
      console.error("   response.data:", error.response.data);
    }
    if (error.errors) {
      console.error("   errors:", error.errors);
    }

    // re-lanzamos para que el controller devuelva 500
    throw error;
  } finally {
    // limpieza opcional: borrar el archivo temporal del server
    try {
      if (localPath && fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log("🧼 [Drive] Archivo temporal borrado:", localPath);
      }
    } catch (cleanupErr) {
      console.warn(
        "⚠️ [Drive] No se pudo borrar el tmp local:",
        cleanupErr.message
      );
    }
  }
}

export async function deleteFromDrive(fileId) {
  console.log("🗑 [Drive] Eliminando archivo de Drive:", fileId);
  try {
    await drive.files.delete({
      fileId,
    });
    console.log("✅ [Drive] Archivo eliminado OK:", fileId);
    return true;
  } catch (err) {
    console.error("❌ [Drive] Error eliminando archivo:", fileId, err.message);
    throw err;
  }
}