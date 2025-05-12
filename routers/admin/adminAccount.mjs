import * as controller from '../../controllers/account.mjs';
import * as validators from '../../middleware/validators.mjs';
import accountRouter from '../account.mjs';
import { Router } from 'express';

const app = Router();

// Only allow user to attempt log in if email is for an admin account.
// This will override the original log in route defined in accountRouter.
app.post('/log-in', validators.createAdminLogInChain(), controller.postLogIn);

app.use('/', accountRouter);

export default app;
