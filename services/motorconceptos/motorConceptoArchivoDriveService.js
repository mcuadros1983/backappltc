import {
    uploadToDrive,
    deleteFromDrive
} from "../googleDriveService.js";

class MotorConceptoArchivoDriveService {

    async upload(file) {
        return uploadToDrive({
            originalName: file.originalname,
            mimeType: file.mimetype,
            localPath: file.path
        });
    }

}

export default new MotorConceptoArchivoDriveService();