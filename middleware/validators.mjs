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
  return [
    email(),
    body('name').notEmpty().withMessage('Name is required'),
    password(),
    confirmPassword(),
  ];
}

function createResetPasswordChain() {
  return [password(), confirmPassword()];
}

function createLogInChain() {
  return [
    email(),
    body('password').notEmpty().withMessage('Password is required'),
  ];
}

function createBlogChain() {
  return [
    body('title').notEmpty().withMessage('A title is required'),
    body('publishedAt')
      .optional()
      .custom((value) => !isNaN(Date.parse(value)))
      .withMessage('Published at is not a valid date'),
  ];
}

export {
  email,
  password,
  createSignUpChain,
  createResetPasswordChain,
  createLogInChain,
  createBlogChain,
};
