import db from '../db/prismaClient.mjs';
import { body, query } from 'express-validator';

function email() {
  return body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be in correct format')
    .notEmpty()
    .withMessage('Email is required');
}

function password() {
  return body('password')
    .isStrongPassword({ minLength: 8 })
    .withMessage(
      'Password must be at least 8 characters, with at least one of each: a digit, symbol, upper and lowercase characters',
    )
    .notEmpty()
    .withMessage('Password is required');
}

function confirmPassword() {
  return body('confirm_password')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password and confirm password do not match')
    .notEmpty()
    .withMessage('Confirm password is required');
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

function createAdminLogInChain() {
  return [
    body('email').custom(async (value) => {
      const user = await db.user.findUnique({
        where: {
          email: value || '',
        },
      });

      if (!user?.isAdmin) {
        throw new Error('User is not an admin');
      }
    }),
    email(),
    body('password').notEmpty().withMessage('Password is required'),
  ];
}

function createBlogChain() {
  return [
    body('title').notEmpty().withMessage('A title is required'),
    body('publishedAt').customSanitizer((value) => {
      // A form submitted with no date in the field will send an empty string.
      // Prisma expects either a DateTime or null, so turn that empty string into a null value.
      if (value?.length === 0) {
        return null;
      } else {
        // If string is not empty, and can be turned into a valid date, turn it into an actual date object.
        if (!isNaN(Date.parse(value))) return new Date(value);
        throw new Error('Published at is not a valid date');
      }
    }),
  ];
}

function createCommentChain() {
  return [
    query('blogId')
      .notEmpty()
      .withMessage('Comment requires a blogId')
      .custom(async (id) => {
        // Check blog exists. If this finds nothing it will throw an error.
        const blog = await db.blog.findUnique({
          where: {
            id,
          },
        });
        if (!blog) throw new Error('Blog does not exist');
      })
      .withMessage('Blog does not exist'),
    body('text').notEmpty().withMessage('Comment requires text'),
  ];
}

function createUserChain() {
  return [
    body('name').trim().notEmpty().withMessage('A name is required'),
    email(),
    // If checkbox is on, the value will be on. If the checkbox is off, nothing will be sent at all.
    // Turn this into a boolean value suitable for prisma to use.
    body('isAdmin').customSanitizer((value) => {
      return value ? true : false;
    }),
    body('isBanned').customSanitizer((value) => {
      return value ? true : false;
    }),
  ];
}

function createNewUserChain() {
  return [createUserChain(), password(), confirmPassword()];
}

export {
  email,
  password,
  createSignUpChain,
  createResetPasswordChain,
  createLogInChain,
  createAdminLogInChain,
  createBlogChain,
  createCommentChain,
  createUserChain,
  createNewUserChain,
};
