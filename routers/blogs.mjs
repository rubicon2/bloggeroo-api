import * as controller from '../controllers/blogs.mjs';
import * as token from '../middleware/token.mjs';
import * as auth from '../middleware/auth.mjs';
import { createBlogChain as validateBlog } from '../middleware/validators.mjs';
import { urlQueryToPrisma } from 'url-query-to-prisma';
import { blogsQueryFormatter } from '../db/queryFormatters.mjs';
import { Router } from 'express';

const app = Router();

app.get(
  '/',
  token.getQueryToken,
  token.verifyToken({ showErrors: true }),
  auth.getUser({ showErrors: true }),
  urlQueryToPrisma('query', blogsQueryFormatter),
  controller.getBlogs,
);

app.get(
  '/:blogId',
  token.getQueryToken,
  token.verifyToken(),
  auth.getUser(),
  controller.getBlog,
);

app.post(
  '/',
  token.getQueryToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  validateBlog(),
  controller.postBlog,
);

app.put(
  '/:blogId',
  token.getQueryToken,
  token.verifyToken({ showErrors: true }),
  auth.getUser({ showErrors: true }),
  auth.isAuth,
  validateBlog(),
  controller.putBlog,
);

app.delete(
  '/:blogId',
  token.getQueryToken,
  token.verifyToken({ showErrors: true }),
  auth.getUser({ showErrors: true }),
  auth.isAuth,
  controller.deleteBlog,
);

export default app;
