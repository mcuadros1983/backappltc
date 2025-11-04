import { Router } from 'express';
import { getSnapshot, postEmployeeEmbeddings } from '../../controllers/asistencia/embeddingsController.js';
// Si tenés auth de dispositivos o admin, insertá middlewares acá.

const embeddingsRouter = Router();
// Descarga snapshot/diff (GZIP + firma HMAC + ETag)
embeddingsRouter.get('/embeddings/snapshot', getSnapshot);
embeddingsRouter.post('/embeddings/:empleadoId', postEmployeeEmbeddings); // alta de vectores (entrenamiento)
export default embeddingsRouter;
