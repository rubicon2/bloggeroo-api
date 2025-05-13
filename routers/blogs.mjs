import * as controller from '../controllers/blogs.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { blogsQueryFormatter } from '../db/queryFormatters.mjs';

import { urlQueryToPrisma } from 'url-query-to-prisma';
import { Router } from 'express';

const app = Router();

app.get(
  '/',
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  urlQueryToPrisma('query', blogsQueryFormatter),
  controller.getPublishedBlogs,
);

app.get(
  '/:blogId',
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  controller.getBlog,
);

export default app;
