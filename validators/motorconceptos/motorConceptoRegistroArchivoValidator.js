import path from "path";

const normalizeArray = (
  value
) =>
  Array.isArray(value)
    ? value
        .map((item) =>
          String(item)
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    : [];

const extensionOf = (
  fileName
) =>
  path
    .extname(
      fileName || ""
    )
    .replace(".", "")
    .toLowerCase();

const validateFile = (
  archivoTipo,
  file
) => {
  if (!file) {
    throw new Error(
      "Debe seleccionar un archivo"
    );
  }

  // if (!file.path) {
  //   throw new Error(
  //     "No se generó el archivo temporal"
  //   );
  // }

  const allowedExtensions =
    normalizeArray(
      archivoTipo
        .extensiones_permitidas
    );

  const allowedMimeTypes =
    normalizeArray(
      archivoTipo
        .mime_types_permitidos
    );

  const extension =
    extensionOf(
      file.originalname
    );

  if (
    allowedExtensions.length &&
    !allowedExtensions.includes(
      extension
    )
  ) {
    throw new Error(
      `${file.originalname}: extensión no permitida`
    );
  }

  const mimeType =
    String(
      file.mimetype || ""
    ).toLowerCase();

  if (
    allowedMimeTypes.length &&
    !allowedMimeTypes.includes(
      mimeType
    )
  ) {
    throw new Error(
      `${file.originalname}: tipo MIME no permitido`
    );
  }

  const maximumMb =
    Number(
      archivoTipo
        .tamanio_maximo_mb
    );

  if (
    Number.isFinite(
      maximumMb
    ) &&
    maximumMb > 0 &&
    Number(file.size) >
      maximumMb *
        1024 *
        1024
  ) {
    throw new Error(
      `${file.originalname}: supera ${maximumMb} MB`
    );
  }
};

export const validateUpload = ({
  archivoTipo,
  files,
  currentCount,
}) => {
  if (!archivoTipo) {
    throw new Error(
      "Tipo de archivo no encontrado"
    );
  }

  if (
    archivoTipo.activo ===
    false
  ) {
    throw new Error(
      "El tipo de archivo está inactivo"
    );
  }

  const selected =
    Array.from(
      files || []
    );

  if (!selected.length) {
    throw new Error(
      "Debe seleccionar al menos un archivo"
    );
  }

  if (
    !archivoTipo
      .permite_multiples &&
    Number(currentCount) +
      selected.length >
      1
  ) {
    throw new Error(
      "El tipo configurado sólo permite un archivo"
    );
  }

  selected.forEach(
    (file) =>
      validateFile(
        archivoTipo,
        file
      )
  );

  return selected;
};

export const validateReplacement = ({
  archivoTipo,
  file,
}) => {
  validateFile(
    archivoTipo,
    file
  );

  return file;
};

export default {
  validateUpload,
  validateReplacement,
};
