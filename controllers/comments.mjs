import db from '../db/prismaClient.mjs';
import formatValidationErrors from '../helpers/formatValidationErrors.mjs';
import { validationResult, matchedData } from 'express-validator';

// Should comments be nested within blogs or not?
// On one hand, comments will always relate to particular blogs.
// But the different components of a react app, for instance will be making separate api calls.
// One for the blog content, another for the comments.
// example.com/blogs/someId
// example.com/comments?blog=someId
// As opposed to the following:
// example.com/blogs/someId/comments
// Feel like the first approach is more flexible, e.g. an admin could look at all the comments on
// the site at once and edit or run a search through them for harmful content, etc, without getting
// all the blogs.

async function getComments(req, res, next) {
  // How to format replies and such? A tree structure? Or just a chronological list of comments?
  try {
    const comments = await db.comment.findMany({
      ...req.prismaQueryParams,
      include: {
        owner: {
          select: {
            name: true,
            isAdmin: true,
            isBanned: true,
          },
        },
        parentComment: {
          include: {
            owner: {
              select: {
                name: true,
                isAdmin: true,
                isBanned: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        comments,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getComment(req, res, next) {
  try {
    const comment = await db.comment.findUnique({
      where: {
        id: req.params.commentId,
      },
      include: {
        owner: {
          select: {
            name: true,
            isAdmin: true,
            isBanned: true,
          },
        },
        parentComment: {
          include: {
            owner: {
              select: {
                name: true,
                isAdmin: true,
                isBanned: true,
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'Comment not found',
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        comment,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function postComment(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: result
            .array()
            .map((err) => err.msg)
            .join('\n'),
          validationErrors: formatValidationErrors(result.array()),
        },
      });
    }

    const comment = await db.comment.create({
      data: {
        ownerId: req.user.id,
        ...matchedData(req),
      },
    });

    return res.status(201).json({
      status: 'success',
      data: {
        comment,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function putComment(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(403).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(result.array()),
        },
      });
    }

    const comment = await db.comment.findUnique({
      where: {
        id: req.params.commentId,
      },
    });

    if (!comment) {
      return res.status(400).json({
        status: 'fail',
        data: {
          message: 'Comment does not exist',
        },
      });
    }

    // If user is owner of comment, or an admin, let them update it.
    if (req.user.isAdmin || req.user.id === comment.ownerId) {
      const updated = await db.comment.update({
        where: {
          id: comment.id,
        },
        data: {
          ...req.body,
        },
      });

      return res.status(200).json({
        status: 'success',
        data: {
          comment: updated,
        },
      });
    }

    // If user is not authorised to update, tell them why.
    return res.status(403).json({
      status: 'fail',
      data: {
        message: 'You are not authorised to update this resource',
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await db.comment.findUnique({
      where: {
        id: req.params.commentId,
      },
    });

    if (!comment) {
      return res.status(400).json({
        status: 'fail',
        data: {
          message: 'Comment does not exist',
        },
      });
    }

    // Delete that comment, only if user is admin or owner of comment.
    if (req.user.id !== comment.ownerId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: 'You are not authorized to delete this comment',
        },
      });
    }

    await db.comment.delete({
      where: {
        id: comment.id,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    return next(error);
  }
}

export { getComments, getComment, postComment, putComment, deleteComment };
