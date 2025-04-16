import db from '../db/prismaClient.mjs';

async function getUser(req, res, next) {
  // This is basically doing what passport would be doing. Getting the user from the db.
  // With jwt, passport does not actually deal with logging in or anything.
  // But should we get user with id or email? The field will have to be in both refresh and access tokens.
  try {
    if (!req.tokenData)
      throw new Error(
        'No token data - need to include verifyToken in middleware chain',
      );

    // Use id or email to get user?
    const user = await db.user.findUnique({
      where: {
        email: req.tokenData.email,
      },
    });
    if (!user) throw new Error('User does not exist');
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function isAuth(req, res, next) {
  if (req.user) return next();
  else
    return next(new Error('You need to be logged in to access this resource'));
}

function isAdmin(req, res, next) {
  if (req.user.isAdmin) return next();
  else
    return next(new Error('You need to be an admin to access this resource'));
}

// How to check if admin or owner of resource? Errrrr. A middleware for this would be great,
// but how to check owner of resource without getting it from the db first? Impossible.

export { getUser, isAuth, isAdmin };
