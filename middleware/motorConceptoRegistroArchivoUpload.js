import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";
import crypto from "crypto";

const temporaryFolder =
  path.join(
    os.tmpdir(),
    "erp-la-tradicion",
    "motor-conceptos"
  );

fs.mkdirSync(
  temporaryFolder,
  {
    recursive: true,
  }
);

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      callback
    ) => {
      callback(
        null,
        temporaryFolder
      );
    },

    filename: (
      req,
      file,
      callback
    ) => {
      const extension =
        path.extname(
          file.originalname
        );

      callback(
        null,
        `${Date.now()}-${crypto.randomUUID()}${extension}`
      );
    },
  });

const upload = multer({
  storage,
  limits: {
    files: 25,
    fileSize:
      100 *
      1024 *
      1024,
  },
});

export const uploadMultiple =
  upload.array(
    "files",
    25
  );

export const uploadReplacement =
  upload.single(
    "file"
  );
