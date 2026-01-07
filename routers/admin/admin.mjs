import * as token from '../../middleware/token.mjs';
import * as auth from '../../middleware/auth.mjs';
import adminAccountRouter from './adminAccount.mjs';
import adminBlogsRouter from './adminBlogs.mjs';
import adminCommentsRouter from './adminComments.mjs';
import adminUsersRouter from './adminUsers.mjs';
import adminImagesRouter from './adminImages.mjs';
import authRouter from '../auth.mjs';

import { Router } from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = Router();

const whitelist = Array.from(
  process.env.CORS_ADMIN_WHITELIST.split(',').map((str) => str.trim()),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(
          new Error(
            'Not allowed by CORS - only admin client can access admin routes',
          ),
        );
      }
    },
    credentials: true,
  }),
);

// Needs to be before checking user is logged in
// as admin, otherwise they won't be able to log in.
app.use('/account', adminAccountRouter);
// Also without valid access token, will not be considered logged in.
app.use('/auth', authRouter);

// Ensure user is logged in and an admin before accessing any other routes.
app.use(
  token.getHeaderToken,
  token.verifyToken(),
  auth.getUser(),
  auth.isAuth,
  auth.isAdmin,
);

app.use('/blogs', adminBlogsRouter);
app.use('/comments', adminCommentsRouter);
app.use('/users', adminUsersRouter);
app.use('/images', adminImagesRouter);

export default app;
