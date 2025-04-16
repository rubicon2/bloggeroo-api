import * as controller from '../controllers/account.mjs';
import * as validators from '../middleware/validators.mjs';
import * as token from '../middleware/token.mjs';
import { Router } from 'express';

const app = Router();

app.post('/log-in', validators.createLogInChain(), controller.postLogIn);
app.post(
  '/log-out',
  token.getHeaderToken,
  token.verifyToken,
  controller.postLogOut,
);
app.post('/sign-up', validators.createSignUpChain(), controller.postSignUp);
app.post(
  '/confirm-email',
  token.getQueryToken,
  token.verifyToken,
  controller.postConfirmEmail,
);
app.post(
  '/request-password-reset',
  validators.email(),
  controller.postPasswordResetRequest,
);
app.post(
  '/reset-password',
  validators.createResetPasswordChain(),
  token.getQueryToken,
  token.verifyToken,
  controller.postPasswordReset,
);
app.post(
  '/request-close-account',
  token.getHeaderToken,
  token.verifyToken,
  controller.postCloseAccountRequest,
);
app.delete(
  '/',
  token.getQueryToken,
  token.verifyToken,
  controller.deleteAccount,
);

export default app;
