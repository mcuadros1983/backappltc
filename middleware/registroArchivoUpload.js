import multer from "multer";

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 25;

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES_PER_REQUEST,
    },
});

export const registroArchivoUpload = upload.array(
    "files",
    MAX_FILES_PER_REQUEST
);

export default registroArchivoUpload;
