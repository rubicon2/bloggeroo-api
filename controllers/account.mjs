import db from '../db/prismaClient.mjs';
import {
  sendSignUpConfirmEmail,
  sendAttemptedSignUpEmail,
  sendPasswordResetEmail,
  sendAccountDeleteEmail,
} from '../mailer/nodemailer.mjs';
import formatValidationErrors from '../helpers/formatValidationErrors.mjs';

import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

async function postLogIn(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      data: {
        validationErrors: formatValidationErrors(result.array()),
      },
    });
  }

  try {
    const user = await db.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    // Mimic format we are using for validationErrors, so if user does not exist
    // or password is just incorrect, the client will not be able to discern whether
    // or not a user account exists.
    const logInFailData = {
      validationErrors: {
        password: 'Incorrect email or password.',
        array: ['Incorrect email or password'],
      },
    };

    if (!user)
      return res.status(400).json({
        status: 'fail',
        data: logInFailData,
      });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (match) {
      // Do not let user log in if they have been banned.
      if (user.isBanned)
        return res.status(403).json({
          status: 'fail',
          data: {
            message: 'User is banned.',
          },
        });

      // Should refresh and access tokens have the same payload? Or not?
      // No - if permissions change then they will be updated for the user
      // when they get a new access token. The refresh token shouldn't have
      // any data on it that is likely to change, like permissions, etc.
      // User email on refresh token - when refresh is used, email is used
      // to get user from db, and new access token will be generated.
      const refresh = jwt.sign({ email: user.email }, process.env.SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_LIFETIME,
      });

      const access = jwt.sign(
        {
          id: user.id,
          email: user.email,
          isAdmin: user.isAdmin,
          isBanned: user.isBanned,
        },
        process.env.SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_LIFETIME,
        },
      );

      // Refresh token is stored in a secure httpOnly, secure, sameSite strict cookie.
      // This should prevent CSRF (cross-site request forgery) attacks, where an auth cookie
      // is sent automatically along with API requests initiated from other sites.
      const cookieExpTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
      res.cookie('refresh', refresh, {
        httpOnly: true,
        secure: process.env.SECURE_COOKIES,
        sameSite: 'none',
        partitioned: true,
        // Expire in 28 days just like the refresh token.
        // Now refresh token is pulled in from env file, just set this to a year or something stupid?
        // The refresh token will expire long before the cookie anyway.
        expires: cookieExpTime,
      });

      // This cookie is set just so the js knows the user is logged in.
      res.cookie('login', 'true', {
        httpOnly: false,
        secure: process.env.SECURE_COOKIES,
        sameSite: 'none',
        partitioned: true,
        expires: cookieExpTime,
      });

      // Client will store the access token however they like. Not the server's business.
      return res.status(200).json({
        status: 'success',
        data: {
          access,
        },
      });
    } else {
      return res.status(400).json({
        status: 'fail',
        data: logInFailData,
      });
    }
  } catch (error) {
    return next(error);
  }
}

async function postLogOut(req, res) {
  // Tokens should be cleared by client on their side.
  // All we need to do here is add the tokens to the blacklist.
  await db.revokedToken.create({
    data: {
      token: req.token,
      // jwt exp is in seconds, dates are in millis, so need to convert
      expiresAt: new Date(req.tokenData.exp * 1000),
    },
  });
  // Clear the client cookie.
  res.clearCookie('refresh', {
    httpOnly: true,
    secure: process.env.SECURE_COOKIES,
    sameSite: 'none',
    partitioned: true,
  });
  res.clearCookie('login', {
    httpOnly: false,
    secure: process.env.SECURE_COOKIES,
    sameSite: 'none',
    partitioned: true,
  });
  return res.status(200).json({
    status: 'success',
    data: null,
  });
}

async function postSignUp(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(result.array()),
        },
      });
    }

    // If no errors...
    const { email, password, name } = req.body;
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
          name,
        },
        process.env.SECRET,
        { expiresIn: process.env.CONFIRM_EMAIL_TOKEN_LIFETIME },
      );
      // Send email to user's email address, containing link with token.
      await sendSignUpConfirmEmail(email, token);
      // For now return token and see if we can use that to complete sign up with a post.
      return res.status(200).json({
        status: 'success',
        data: {
          message:
            'Please confirm your email address to complete the sign up process.',
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        message:
          'Please confirm your email address to complete the sign up process.',
      },
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
        name: req.tokenData.name,
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
      status: 'success',
      data: {
        message: 'Your email has been successfully confirmed.',
        user: {
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          isBanned: user.isBanned,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function postPasswordResetRequest(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(result.array()),
        },
      });
    }

    // Check user actually exists first.
    const user = await db.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      // Just pretend an email was sent.
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'An email has been sent with a link to reset your password.',
        },
      });
    }

    // Send email with link to reset password.
    const token = jwt.sign(
      {
        email: req.body.email,
      },
      process.env.SECRET,
      { expiresIn: process.env.RESET_PASSWORD_TOKEN_LIFETIME },
    );
    await sendPasswordResetEmail(req.body.email, token);

    return res.status(200).json({
      status: 'success',
      data: {
        message: 'An email has been sent with a link to reset your password.',
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function postPasswordReset(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(result.array()),
        },
      });
    }

    // Add token to blacklist so it cannot be used again.
    await db.revokedToken.create({
      data: {
        token: req.token,
        expiresAt: new Date(req.tokenData.exp * 1000),
      },
    });

    // If account doesn't exist, just pretend to update - stop hackers from
    // figuring out whether or not an email is associated with an account.
    const user = await db.user.findFirst({
      where: {
        email: req.tokenData.email,
      },
    });

    if (!user) {
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Your password has been successfully updated.',
        },
      });
    }

    // Actually reset password (client will have a page with form, etc.)
    const hash = await bcrypt.hash(req.body.password, 10);
    await db.user.update({
      where: {
        email: req.tokenData.email,
      },
      data: {
        password: hash,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        message: 'Your password has been successfully updated.',
      },
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
      { expiresIn: process.env.CLOSE_ACCOUNT_TOKEN_LIFETIME },
    );
    await sendAccountDeleteEmail(req.tokenData.email, token);

    return res.status(200).json({
      status: 'success',
      data: {
        message: 'An email has been sent with a link to delete your account.',
      },
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
      status: 'success',
      data: {
        message: 'Your account has been successfully deleted.',
        user: {
          id: user.id,
          email: user.email,
        },
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
