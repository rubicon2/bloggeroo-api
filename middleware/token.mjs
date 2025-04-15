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

function getQueryToken(req, res, next) {
  if (req.query.token) req.token = req.query.token;
  return next();
}

function verifyToken(req, res, next) {
  // Make sure token contained req.token has not been tampered with.
  jwt.verify(req.token, process.env.SECRET, async (error, decoded) => {
    try {
      if (error) {
        delete req.token;
        throw error;
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
      return next(error);
    }
  });
}

export { getHeaderToken, getQueryToken, verifyToken };
