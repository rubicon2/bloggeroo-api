import db from '../db/prismaClient.mjs';
import {
  sendSignUpConfirmEmail,
  sendAttemptedSignUpEmail,
} from '../mailer/nodemailer.mjs';

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function postLogIn(req, res, next) {
  // Something to do with passport, I guess?
  // Send an access and a refresh token to the client.
  return res.json({
    message: 'Log in posted, wow!',
  });
}

function postLogOut(req, res, next) {
  // Clear the user token from the header?
}

async function postSignUp(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Will probably want to format this more nicely for client consumption.
    return res.status(400).json({ errors: result.array() });
  }
  // If no errors...
  const { email, password } = req.body;
  const existingUser = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    // If email is already in use, send an email telling the user someone tried to use their email to sign up.
    // await sendAttemptedSignUpEmail(email);
  } else {
    // If email not in use, send email with token to confirm email.
    const hash = await bcrypt.hash(password, 10);
    const token = jwt.sign(
      {
        email,
        hash,
      },
      process.env.SECRET,
      { expiresIn: '30m' },
    );
    // Send email to user's email address, containing link with token.
    // await sendSignUpConfirmEmail(email, token);
    // For now return token and see if we can use that to complete sign up with a post.
    return res.status(200).json({
      message:
        'Please confirm your email address to complete the sign up process.',
      token,
    });
  }

  return res.status(200).json({
    message:
      'Please confirm your email address to complete the sign up process.',
  });
}

async function postConfirmEmail(req, res, next) {
  try {
    // Add entry to db, using details from authentication token.
    // This should be secure - the token contains the user's email and password hash.
    // It will be in their email, but the http request should be encrypted and secure.
    // Even if someone gets their hands on the hash, they will only be able to do
    // anything with it if they gained access to the database, in which case we have
    // bigger problems. Unless they know the user's actual password, they can't do
    // anything with the hash and the client side log in forms.
    const user = await db.user.create({
      data: {
        email: req.tokenData.email,
        password: req.tokenData.hash,
      },
    });
    // Add token to blacklist so it cannot be used again.
    await db.revokedToken.create({
      data: {
        token: req.token,
        expiresAt: new Date(req.tokenData.exp),
      },
    });
    return res.status(201).json({
      email: user.email,
      isAdmin: user.isAdmin,
      isBanner: user.isBanned,
    });
  } catch (error) {
    return next(error);
  }
}

function postPasswordResetRequest(req, res, next) {}

function getPasswordReset(req, res, next) {
  // Redirect to postPasswordReset, basically.
}

function postPasswordReset(req, res, next) {}

export {
  postLogIn,
  postLogOut,
  postSignUp,
  postConfirmEmail,
  postPasswordResetRequest,
  getPasswordReset,
  postPasswordReset,
};
