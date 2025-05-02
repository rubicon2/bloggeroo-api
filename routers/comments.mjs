import * as controller from '../controllers/comments.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { createCommentChain as validateComment } from '../middleware/validators.mjs';
import { urlQueryToPrisma } from 'url-query-to-prisma';
import { commentsQueryFormatter } from '../db/queryFormatters.mjs';
import { body } from 'express-validator';
import { Router } from 'express';

const app = Router();

app.get(
  '/',
  urlQueryToPrisma('query', commentsQueryFormatter),
  controller.getComments,
);
app.post(
  '/',
  token.getQueryToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  validateComment(),
  controller.postComment,
);
app.put(
  '/:commentId',
  token.getQueryToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  body('text').notEmpty().withMessage('Comment requires text'),
  controller.putComment,
);

export default app;
