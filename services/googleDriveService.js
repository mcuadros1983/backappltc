import { google } from "googleapis";
import fs from "fs";
import { Readable } from "stream";

// Para __dirname en ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // 1. Cargar credenciales JSON de la service account
// const serviceAccountPath = path.join(
//   __dirname,
//   "../config/gdrive-service-account.json"
// );
// ======================================================
// CREDENCIALES GOOGLE DRIVE
// ======================================================

const GOOGLE_DRIVE_PROJECT_ID =
  process.env.GOOGLE_DRIVE_PROJECT_ID;

const GOOGLE_DRIVE_CLIENT_EMAIL =
  process.env.GOOGLE_DRIVE_CLIENT_EMAIL;

const GOOGLE_DRIVE_PRIVATE_KEY =
  process.env.GOOGLE_DRIVE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    .trim();

const DRIVE_PARENT_FOLDER_ID =
  process.env.DRIVE_PARENT_FOLDER_ID;


// ======================================================
// VALIDACIONES
// ======================================================

if (!GOOGLE_DRIVE_PROJECT_ID) {
  throw new Error(
    "GOOGLE_DRIVE_PROJECT_ID no está configurado"
  );
}

if (!GOOGLE_DRIVE_CLIENT_EMAIL) {
  throw new Error(
    "GOOGLE_DRIVE_CLIENT_EMAIL no está configurado"
  );
}

if (!GOOGLE_DRIVE_PRIVATE_KEY) {
  throw new Error(
    "GOOGLE_DRIVE_PRIVATE_KEY no está configurado"
  );
}


// ======================================================
// LOGS DE DIAGNÓSTICO SEGUROS
// ======================================================

console.log(
  "🔑 [Drive] project_id:",
  GOOGLE_DRIVE_PROJECT_ID
);

console.log(
  "🔑 [Drive] client_email:",
  GOOGLE_DRIVE_CLIENT_EMAIL
);

console.log(
  "🔐 [Drive] private_key length:",
  GOOGLE_DRIVE_PRIVATE_KEY.length
);

console.log(
  "🔐 [Drive] private_key comienza correctamente:",
  GOOGLE_DRIVE_PRIVATE_KEY.startsWith(
    "-----BEGIN PRIVATE KEY-----"
  )
);

console.log(
  "🔐 [Drive] private_key termina correctamente:",
  GOOGLE_DRIVE_PRIVATE_KEY.endsWith(
    "-----END PRIVATE KEY-----"
  )
);

console.log(
  "📂 [Drive] DRIVE_PARENT_FOLDER_ID:",
  DRIVE_PARENT_FOLDER_ID || "(no configurado)"
);


// ======================================================
// AUTENTICACIÓN GOOGLE
// ======================================================

const auth = new google.auth.JWT({
  email: GOOGLE_DRIVE_CLIENT_EMAIL,
  key: GOOGLE_DRIVE_PRIVATE_KEY,
  scopes: [
    "https://www.googleapis.com/auth/drive",
  ],
});
const testDriveAuth = async () => {

  console.log(
    "========== TEST GOOGLE AUTH =========="
  );

  try {

    console.log(
      "Service Account:",
      GOOGLE_DRIVE_CLIENT_EMAIL
    );

    await auth.authorize();

    console.log(
      "✅ GOOGLE AUTH CORRECTO"
    );

  } catch (error) {

    console.error(
      "❌ GOOGLE AUTH FALLÓ"
    );

    console.error(
      "message:",
      error.message
    );

    console.error(
      "response:",
      error.response?.data
    );
  }

  console.log(
    "======================================"
  );
};

testDriveAuth();



// 3. Cliente de la API Drive
const drive = google.drive({ version: "v3", auth });

// 4. Función para subir al Drive
export async function uploadToDrive({ originalName, mimeType, localPath = null, buffer = null, folderId = null }) {
  console.log("🚀 [Drive] Iniciando upload...");
  console.log("   📄 originalName:", originalName);
  console.log("   📄 mimeType:", mimeType);
  console.log("   📄 localPath:", localPath);
  console.log(
    "   📦 buffer:",
    Buffer.isBuffer(buffer)
      ? `${buffer.length} bytes`
      : "no recibido"
  );

  try {
    console.log("🔐 [Drive] Pidiendo token (auth.authorize())...");
    const tokenInfo = await auth.authorize();
    console.log(
      "✅ [Drive] Token OK. Expira:",
      tokenInfo?.expiry_date
        ? new Date(tokenInfo.expiry_date).toLocaleString()
        : "(sin expiry_date)"
    );

    console.log(
      "========== GOOGLE SERVICE ACCOUNT =========="
    );

    GOOGLE_DRIVE_PROJECT_ID

    console.log(
      "Service Account:",
      GOOGLE_DRIVE_CLIENT_EMAIL
    );
    console.log(
      "private_key_id:",
      GOOGLE_DRIVE_PRIVATE_KEY
    );

    console.log(
      "private_key existe:",
      Boolean(
        GOOGLE_DRIVE_PRIVATE_KEY
      )
    );

    console.log(
      "private_key formato PEM:",
      serviceAccount.private_key
        ?.startsWith(
          "-----BEGIN PRIVATE KEY-----"
        )
    );

    console.log(
      "private_key termina correctamente:",
      serviceAccount.private_key
        ?.trim()
        .endsWith(
          "-----END PRIVATE KEY-----"
        )
    );

    console.log(
      "============================================"
    );

    // metadata del archivo en Drive
    const targetFolderId =
      folderId ||
      DRIVE_PARENT_FOLDER_ID ||
      null;

    const fileMetadata = {

      name:
        originalName,

      ...(
        targetFolderId
          ? {
            parents: [
              targetFolderId,
            ],
          }
          : {}
      ),

    };

    // stream binario del archivo temporal
    let body;

    if (localPath) {

      body =
        fs.createReadStream(
          localPath
        );

    } else if (
      Buffer.isBuffer(
        buffer
      )
    ) {

      body =
        Readable.from(
          buffer
        );

    } else {

      throw new Error(
        "No se recibió localPath ni buffer para subir el archivo"
      );

    }

    const media = {
      mimeType,
      body,
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

      id:
        fileId,

      fileId,

      webViewLink:
        response.data.webViewLink ||
        "",

      webContentLink:
        response.data.webContentLink ||
        "",

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