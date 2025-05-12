import * as controller from '../controllers/users.mjs';
import { getQueryToken, verifyToken } from '../middleware/token.mjs';
import { getUser } from '../middleware/auth.mjs';
import { Router } from 'express';

const app = Router();

app.get(
  '/:userId',
  getQueryToken,
  verifyToken(),
  getUser(),
  controller.getUser,
);

export default app;
