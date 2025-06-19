import * as controller from '../../controllers/blogs.mjs';
import { createBlogChain as validateBlog } from '../../middleware/validators.mjs';
import { blogsQueryFormatter } from '../../db/queryFormatters.mjs';
import blogsRouter from '../blogs.mjs';

import { urlQueryToPrisma } from 'url-query-to-prisma';
import { Router } from 'express';

const app = Router();

app.get('/', urlQueryToPrisma(blogsQueryFormatter), controller.getAllBlogs);
app.post('/', validateBlog(), controller.postBlog);
app.put('/:blogId', validateBlog(), controller.putBlog);
app.delete('/:blogId', controller.deleteBlog);

// So user has access to all the same routes from /admin/blogs as they do from /blogs.
app.use('/', blogsRouter);

export default app;
