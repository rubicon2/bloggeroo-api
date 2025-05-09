import db from '../db/prismaClient.mjs';
import formatValidationErrors from '../helpers/formatValidationErrors.mjs';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

async function getUsers(req, res, next) {
  // Admin only.
  try {
    const users = await db.user.findMany({
      ...req.prismaQueryParams,
      omit: {
        password: true,
      },
      // Should these be included, or should the client fetch blogs and comments in separate fetch calls?
      include: {
        blogs: true,
        comments: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        users,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function postUser(req, res, next) {
  // Admin only.
  // Userful for creating users for testing, etc.
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
    // Don't need to check password and confirm_password match, done on validators middleware already.
    const { name, email, password, isBanned, isAdmin } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hash,
        isBanned,
        isAdmin,
      },
      omit: {
        password: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUser(req, res, next) {
  // A regular user can get this.
  // So a user can see a user and their posts and comments.
  try {
    const user = await db.user.findUnique({
      where: {
        id: req.params.userId,
      },
      omit: {
        password: true,
      },
      include: {
        // If user is not an admin, only return published blogs.
        blogs: req.user?.isAdmin
          ? true
          : {
              where: {
                publishedAt: {
                  not: null,
                },
              },
            },
        comments: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'That user does not exist',
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function putUser(req, res, next) {
  // For admin updating user details.
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
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        data: {
          message: 'That user does not exist',
        },
      });
    }

    const updated = await db.user.update({
      where: {
        id: req.params.userId,
      },
      data: {
        ...user,
        ...req.body,
      },
      omit: {
        password: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: updated,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  // For admin deleting a user.
  try {
    const user = await db.user.findUnique({
      where: {
        id: req.params.userId,
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        data: {
          message: 'That user does not exist',
        },
      });
    }

    const deleted = await db.user.delete({
      where: {
        id: req.params.userId,
      },
      omit: {
        password: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        user: deleted,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export { getUsers, postUser, getUser, putUser, deleteUser };
