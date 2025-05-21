import db from '../db/prismaClient.mjs';

// Have option to show errors or not - so depending on the situation,
// we can use the errors here or instead show more specific or useful
// errors in a later middleware (e.g. auth middleware, admin middleware).
function getUser(options = { showErrors: false }) {
  return async (req, res, next) => {
    // This is basically doing what passport would be doing. Getting the user from the db.
    // With jwt, passport does not actually deal with logging in or anything.
    // But should we get user with id or email? The field will have to be in both refresh and access tokens.
    try {
      if (!req.tokenData) throw new Error('Invalid token');

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
      if (options.showErrors) {
        return res.status(401).json({
          status: 'fail',
          data: {
            message: error.message,
          },
        });
      }
      // Move onto the next middleware with no req.user set.
      else return next();
    }
  };
}

function isAuth(req, res, next) {
  if (req.user) {
    if (req.user.isBanned) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: 'You are banned and not allowed to access this resource',
        },
      });
    }
    // If user is logged in and not banned.
    return next();
  } else {
    return res.status(401).json({
      status: 'fail',
      data: {
        message: 'You need to be logged in to access this resource',
      },
    });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.isAdmin) return next();
  else {
    return res.status(403).json({
      status: 'fail',
      data: {
        message: 'You need to be logged in as an admin to access this resource',
      },
    });
  }
}

export { getUser, isAuth, isAdmin };
