import * as controller from '../controllers/auth.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { Router } from 'express';

const app = Router();

app.post(
  '/access',
  token.getCookieToken('refresh'),
  token.verifyToken({ showErrors: true }),
  auth.getUser({ showErrors: true }),
  auth.isAuth,
  controller.postAccess,
);

export default app;
