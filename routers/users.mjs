import * as controller from '../controllers/users.mjs';
import { getQueryToken, verifyToken } from '../middleware/token.mjs';
import { getUser, isAuth, isAdmin } from '../middleware/auth.mjs';
import { usersQueryFormatter } from '../db/queryFormatters.mjs';
import { urlQueryToPrisma } from 'url-query-to-prisma';
import {
  createUserChain as validateUser,
  createNewUserChain as validateNewUser,
} from '../middleware/validators.mjs';
import { Router } from 'express';

const app = Router();

app.get(
  '/',
  getQueryToken,
  verifyToken(),
  getUser(),
  isAuth,
  isAdmin,
  urlQueryToPrisma('query', usersQueryFormatter),
  controller.getUsers,
);

app.post(
  '/',
  getQueryToken,
  verifyToken(),
  getUser(),
  isAuth,
  isAdmin,
  validateNewUser(),
  controller.postUser,
);

app.get(
  '/:userId',
  getQueryToken,
  verifyToken(),
  getUser(),
  controller.getUser,
);

app.put(
  '/:userId',
  getQueryToken,
  verifyToken(),
  getUser(),
  isAuth,
  isAdmin,
  validateUser(),
  controller.putUser,
);

app.delete(
  '/:userId',
  getQueryToken,
  verifyToken(),
  getUser(),
  isAuth,
  isAdmin,
  controller.deleteUser,
);

export default app;
