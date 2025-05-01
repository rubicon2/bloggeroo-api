import authRouter from './routers/auth.mjs';
import accountRouter from './routers/account.mjs';
import blogsRouter from './routers/blogs.mjs';
import db from './db/prismaClient.mjs';
import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/blogs', blogsRouter);

app.use((error, req, res, next) => {
  // Remember - errors should return a status code and message to the client.
  // Try to use this only as a last resort. Other more specific responses
  // (e.g. 400, 401, 403) should be provided by other routes.
  console.error(error);
  return res.status(500).json({
    message: 'An error has occurred',
    error: error.message,
    stack: error.stack,
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
