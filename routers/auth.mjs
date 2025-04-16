import * as controller from '../controllers/auth.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { Router } from 'express';

const app = Router();

app.post(
  '/refresh',
  token.getHeaderToken,
  token.verifyToken,
  auth.getUser,
  auth.isAuth,
  controller.postRefresh,
);

app.post(
  '/access',
  token.getHeaderToken,
  token.verifyToken,
  auth.getUser,
  auth.isAuth,
  controller.postAccess,
);

export default app;
