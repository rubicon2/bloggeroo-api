import accountRouter from './routers/account.mjs';

import express from 'express';
import 'dotenv/config';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/account', accountRouter);

app.listen(process.env.PORT, () =>
  console.log('Listening on port', process.env.PORT),
);
