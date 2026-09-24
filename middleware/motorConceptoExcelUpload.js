import multer from "multer";


const storage =
  multer.memoryStorage();


const fileFilter = (
  req,
  file,
  cb
) => {

  const fileName =
    String(
      file.originalname || ""
    )
      .trim()
      .toLowerCase();


  const validExtension =
    fileName.endsWith(
      ".xlsx"
    );


  if (!validExtension) {

    return cb(
      new Error(
        "El archivo debe ser Excel .xlsx"
      )
    );

  }


  return cb(
    null,
    true
  );

};


export const motorConceptoExcelUpload =
  multer({
    storage,

    limits: {
      fileSize:
        5 * 1024 * 1024,

      files: 1,
    },

    fileFilter,

  }).single(
    "archivo"
  );