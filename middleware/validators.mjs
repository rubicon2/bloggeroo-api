import { body } from 'express-validator';

function email() {
  return body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be in correct format');
}

function password() {
  return body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isStrongPassword({ minLength: 8 })
    .withMessage(
      'Password must be at least 8 characters, with at least one of each: a digit, symbol, upper and lowercase characters',
    );
}

function confirmPassword() {
  return body('confirm_password')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password and confirm password do not match');
}

function createSignUpChain() {
  return [email(), password(), confirmPassword()];
}

function createResetPasswordChain() {
  return [password(), confirmPassword()];
}

export { email, password, createSignUpChain, createResetPasswordChain };
