import db from '../db/prismaClient.mjs';
import { validationResult } from 'express-validator';

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
    const comments = await db.comment.findMany(req.prismaQueryParams);
    return res.status(200).json({
      status: 200,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
}

async function postComment(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(403).json({
        status: 403,
        errors: result.array(),
      });
    }

    const comment = await db.comment.create({
      data: {
        ownerId: req.user.id,
        blogId: req.query.blogId,
        parentCommentId: req.query?.parentCommentId || null,
        text: req.body.text,
      },
    });

    return res.status(201).json({
      status: 201,
      message: 'Comment successfully created',
      comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
}

async function putComment(req, res, next) {
  try {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(403).json({
        status: 403,
        errors: result.array(),
      });
    }

    const comment = await db.comment.findUnique({
      where: {
        id: req.params.commentId,
      },
    });

    if (!comment) {
      return res.status(400).json({
        status: 400,
        message: 'Comment does not exist',
      });
    }

    // If user is owner of comment, or an admin, let them update it.
    if (req.user.isAdmin || req.user.id === comment.ownerId) {
      const updated = await db.comment.update({
        where: {
          id: comment.id,
        },
        data: {
          text: req.body.text,
        },
      });

      return res.status(200).json({
        status: 200,
        message: 'Comment successfully updated',
        comment: updated,
      });
    }

    // If user is not authorised to update, tell them why.
    return res.status(403).json({
      status: 403,
      message: 'You are not authorised to update this resource',
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      error: error.message,
    });
  }
}

async function deleteComment(req, res, next) {}

export { getComments, postComment, putComment, deleteComment };
