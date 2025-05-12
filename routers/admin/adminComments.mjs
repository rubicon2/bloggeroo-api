import commentsRouter from '../comments.mjs';
import { Router } from 'express';

const app = Router();

// So user has access to all the same routes from /admin/comments as they do from /comments.
app.use('/', commentsRouter);

export default app;
