import { body } from 'express-validator';

function createSignUpChain() {
  return [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Email must be in correct format'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isStrongPassword({ minLength: 8 })
      .withMessage(
        'Password must be at least 8 characters, with at least one of each: a digit, symbol, upper and lowercase characters',
      ),
    body('confirm_password')
      .notEmpty()
      .withMessage('Confirm password is required')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Password and confirm password do not match'),
  ];
}

export { createSignUpChain };
