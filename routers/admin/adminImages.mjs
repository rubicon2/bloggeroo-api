import * as controller from '../../controllers/images.mjs';
import * as validators from '../../middleware/validators.mjs';
import upload from '../../middleware/multer.mjs';
import { Router } from 'express';

const app = Router();

app.get('/', controller.getImages);
app.post(
  '/',
  upload.single('image'),
  validators.createNewImageChain(),
  controller.postImage,
);

app.get('/:id', controller.getImage);
app.put(
  '/:id',
  upload.single('image'),
  validators.createPutImageChain(),
  controller.putImage,
);
app.delete('/:id', controller.deleteImage);

export default app;
