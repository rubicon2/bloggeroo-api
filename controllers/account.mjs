import db from '../db/prismaClient.mjs';
import {
  sendSignUpConfirmEmail,
  sendAttemptedSignUpEmail,
  sendPasswordResetEmail,
  sendAccountDeleteEmail,
} from '../mailer/nodemailer.mjs';

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function postLogIn(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Will probably want to format this more nicely for client consumption.
    return res.status(400).json({ errors: result.array() });
  }

  try {
    // Something to do with passport, I guess? << Actually, no. Not this time.
    const user = await db.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user)
      return res.status(400).json({
        message: 'Incorrect email or password.',
      });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (match) {
      // Should refresh and access tokens have the same payload? Or not?
      // No - if permissions change then they will be updated for the user
      // when they get a new access token. The refresh token shouldn't have
      // any data on it that is likely to change, like permissions, etc.
      const refresh = jwt.sign({ email: user.email }, process.env.SECRET, {
        expiresIn: '28d',
      });
      const access = jwt.sign(
        {
          email: user.email,
          isAdmin: user.isAdmin,
          isBanned: user.isBanned,
        },
        process.env.SECRET,
        {
          expiresIn: '15m',
        },
      );
      // Client will store the refresh and access tokens however they like. Not the server's business.
      return res.status(200).json({
        refresh,
        access,
      });
    } else {
      return res.status(400).json({
        message: 'Incorrect email or password.',
      });
    }
  } catch (error) {
    return next(error);
  }
}

async function postLogOut(req, res, next) {
  // Tokens should be cleared by client on their side.
  // All we need to do here is add the tokens to the blacklist.
  await db.revokedToken.create({
    data: {
      token: req.token,
      // jwt exp is in seconds, dates are in millis, so need to convert
      expiresAt: new Date(req.tokenData.exp * 1000),
    },
  });
  return res.status(200).json({
    message: 'Successfully logged out',
  });
}

async function postSignUp(req, res, next) {
  try {
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
      await sendAttemptedSignUpEmail(email);
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
      await sendSignUpConfirmEmail(email, token);
      // For now return token and see if we can use that to complete sign up with a post.
      return res.status(200).json({
        message:
          'Please confirm your email address to complete the sign up process.',
      });
    }

    return res.status(200).json({
      message:
        'Please confirm your email address to complete the sign up process.',
    });
  } catch (error) {
    return next(error);
  }
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
        // jwt exp is in seconds, dates are in millis, so need to convert
        expiresAt: new Date(req.tokenData.exp * 1000),
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

async function postPasswordResetRequest(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Will probably want to format this more nicely for client consumption.
      return res.status(400).json({ errors: result.array() });
    }
    // Send email with link to reset password.
    const token = jwt.sign(
      {
        email: req.body.email,
      },
      process.env.SECRET,
      { expiresIn: '30m' },
    );
    await sendPasswordResetEmail(req.body.email, token);
    return res.status(200).json({
      message:
        'An email has been sent with a link to reset your password. The link will expire in 30 minutes.',
    });
  } catch (error) {
    return next(error);
  }
}

async function postPasswordReset(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      // Will probably want to format this more nicely for client consumption.
      return res.status(400).json({ errors: result.array() });
    }
    // Actually reset password (client will have a page with form, etc.)

    const hash = await bcrypt.hash(req.body.password, 10);
    const user = await db.user.update({
      where: {
        email: req.tokenData.email,
      },
      data: {
        password: hash,
      },
    });

    // Add token to blacklist so it cannot be used again.
    await db.revokedToken.create({
      data: {
        token: req.token,
        expiresAt: new Date(req.tokenData.exp * 1000),
      },
    });
    return res.status(200).json({
      message: 'User password has been updated',
      email: user.email,
      isAdmin: user.isAdmin,
      isBanner: user.isBanned,
    });
  } catch (error) {
    return next(error);
  }
}

async function postCloseAccountRequest(req, res, next) {
  try {
    const token = jwt.sign(
      {
        email: req.tokenData.email,
      },
      process.env.SECRET,
      { expiresIn: '30m' },
    );
    await sendAccountDeleteEmail(req.tokenData.email, token);
    return res.status(200).json({
      message:
        'An email has been sent with a link to delete your account. The link will expire in 30 minutes.',
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const user = await db.user.delete({
      where: {
        email: req.tokenData.email,
      },
    });

    await db.revokedToken.create({
      data: {
        token: req.token,
        expiresAt: new Date(req.tokenData.exp * 1000),
      },
    });

    // It would be good if we could revoke any refresh tokens that relate to this user.
    // Maybe if we store the header token and query token both on the req object?
    return res.status(200).json({
      message: 'User successfully deleted',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export {
  postLogIn,
  postLogOut,
  postSignUp,
  postConfirmEmail,
  postPasswordResetRequest,
  postPasswordReset,
  postCloseAccountRequest,
  deleteAccount,
};
