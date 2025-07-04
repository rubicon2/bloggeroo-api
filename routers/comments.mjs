import * as controller from '../controllers/comments.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { createCommentChain as validateComment } from '../middleware/validators.mjs';
import { urlQueryToPrisma } from 'url-query-to-prisma';
import { commentsQueryFormatter } from '../db/queryFormatters.mjs';
import { body } from 'express-validator';
import { Router } from 'express';

const app = Router();

app.get('/', urlQueryToPrisma(commentsQueryFormatter), controller.getComments);

app.get('/:commentId', controller.getComment);

app.post(
  '/',
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  validateComment(),
  controller.postComment,
);

app.put(
  '/:commentId',
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  body('text').notEmpty().withMessage('Comment requires text'),
  controller.putComment,
);

app.delete(
  '/:commentId',
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  controller.deleteComment,
);

export default app;
