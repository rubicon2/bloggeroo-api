import authRouter from './routers/auth.mjs';
import accountRouter from './routers/account.mjs';
import blogsRouter from './routers/blogs.mjs';
import commentsRouter from './routers/comments.mjs';
import usersRouter from './routers/users.mjs';
import adminRouter from './routers/admin/admin.mjs';
import db from './db/prismaClient.mjs';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// REST tools will have no origin, so allow for that with !origin.
const whitelist = Array.from(
  process.env.CORS_WHITELIST.split(',').map((str) => str.trim()),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS - origin: ${origin}`));
      }
    },
    credentials: true,
  }),
);

app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/blogs', blogsRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

app.use((error, req, res, next) => {
  // Remember - errors should return a status code and message to the client.
  // Try to use this only as a last resort. Other more specific responses
  // (e.g. 400, 401, 403) should be provided by other routes.
  console.error(error);
  return res.status(500).json({
    status: 'error',
    message: error.message,
  });
});

app.listen(process.env.PORT, () =>
  console.log('Listening on port', process.env.PORT),
);

// Every so often, clear any revoked tokens that have expired anyway.
setInterval(async () => {
  try {
    const { count } = await db.revokedToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now()),
        },
      },
    });
    if (count) console.log(`Cleared ${count} revoked tokens from db table`);
  } catch (error) {
    console.error(error);
  }
}, process.env.CLEAR_DB_TOKENS_INTERVAL);
