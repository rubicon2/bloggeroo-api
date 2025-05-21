import db from '../db/prismaClient.mjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

function getHeaderToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (bearerHeader) {
    const jwt = bearerHeader.split(' ')[1];
    req.token = jwt;
  }
  return next();
}

function getCookieToken(cookieName) {
  return (req, res, next) => {
    const cookie = req.headers.cookie;
    if (cookie) {
      const cookies = cookie
        // Split into individual cookies.
        .split(';')
        .map((str) => str.trim())
        // Turn into object containing key value pairs of cookie name and cookie values.
        .reduce((obj, str) => {
          const [key, value] = str.split('=');
          return {
            ...obj,
            [key]: value,
          };
        }, {});
      // Get the one cookie we actually are looking for.
      req.token = cookies?.[cookieName];
    }
    next();
  };
}

function getQueryToken(req, res, next) {
  if (req.query.token) req.token = req.query.token;
  return next();
}

// On some routes we will want the errors (e.g. password reset with query token).
// On others we want to ignore the errors and just leave req.tokenData empty,
// (e.g.) on a route that can be accessed by non-authenticated and authenticated users.
function verifyToken(options = { showErrors: false }) {
  return (req, res, next) => {
    // Make sure token contained req.token has not been tampered with.
    jwt.verify(req.token, process.env.SECRET, async (jwtError, decoded) => {
      try {
        if (jwtError) {
          delete req.token;
          throw new Error(jwtError);
        }

        // Check token is not on the revoked list on the db, i.e. has already been used.
        const revoked = await db.revokedToken.findFirst({
          where: {
            token: req.token,
          },
        });
        if (revoked) {
          delete req.token;
          throw new Error('Invalid token');
        }

        req.tokenData = decoded;
        return next();
      } catch (error) {
        if (options.showErrors) {
          // Status code 401 - unauthorised. Client should try to get a new access token in response, then try the original request again.
          return res.status(401).json({
            status: 'fail',
            data: {
              message: error.message,
            },
          });
        }
        // Move onto next middleware with no req.token, or req.tokenData set.
        else return next();
      }
    });
  };
}

export { getHeaderToken, getQueryToken, getCookieToken, verifyToken };
