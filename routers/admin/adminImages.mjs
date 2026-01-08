import * as controller from '../../controllers/images.mjs';
import * as validators from '../../middleware/validators.mjs';
import { imagesQueryFormatter } from '../../db/queryFormatters.mjs';
import upload from '../../middleware/multer.mjs';
import { urlQueryToPrisma } from 'url-query-to-prisma';
import { Router } from 'express';

const app = Router();

app.get('/', urlQueryToPrisma(imagesQueryFormatter), controller.getImages);
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
