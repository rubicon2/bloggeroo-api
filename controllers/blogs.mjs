import db from '../db/prismaClient.mjs';
import { validationResult } from 'express-validator';

async function getBlogs(req, res, next) {
  try {
    // Should this get all blogs if admin, even unpublished ones? Or not?
    // Yes it should. If the admin doesn't want to see them, that can be filtered clientside.
    // If user is not admin, filter out unpublished blogs, as a non-admin should not be able to get that data.
    if (!req.user?.isAdmin) {
      req.prismaQueryParams.where = {
        ...req.prismaQueryParams?.where,
        publishedAt: {
          not: null,
        },
      };
    }

    const blogs = await db.blog.findMany(req.prismaQueryParams);

    return res.status(200).json({
      status: 200,
      blogs,
    });
  } catch (error) {
    return next(error);
  }
}

async function postBlog(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      status: 400,
      message: 'Form could not be submitted',
      errors: result.array(),
    });
  }

  try {
    const { title, body, publishedAt } = req.body;
    const blog = await db.blog.create({
      data: {
        ownerId: req.user.id,
        title,
        body: body || '',
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });
    return res.status(201).json({
      status: 201,
      message: 'Blog successfully created',
      blog,
    });
  } catch (error) {
    return next(error);
  }
}

async function putBlog(req, res, next) {
  try {
    const blog = await db.blog.findUnique({
      where: {
        id: req.params.blogId,
      },
    });

    if (req.user.id !== blog.ownerId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 403,
        message: 'You are not authorized to update this blog',
      });
    }

    const updated = await db.blog.update({
      where: {
        id: req.params.blogId,
      },
      data: {
        ...req.body,
      },
    });

    return res.status(200).json({
      status: 200,
      message: 'Blog successfully updated',
      blog: updated,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBlog(req, res, next) {
  try {
    const blog = await db.blog.findUnique({
      where: {
        id: req.params.blogId,
      },
      // Include name of author.
      // Not possible at the moment because I declined to include name on User table. Whoops...
    });

    const { user } = req;
    // Only give access if user is admin, or owner, or it is published.
    if (!blog.publishedAt && !user?.isAdmin && user?.id !== blog.ownerId) {
      return res.status(403).json({
        status: 403,
        message: 'You do not have access to this blog.',
      });
    }

    return res.status(200).json({
      status: 200,
      blog,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBlog(req, res, next) {
  try {
    const blog = await db.blog.findUnique({
      where: {
        id: req.params.blogId,
      },
    });

    if (!blog) {
      return res.status(400).json({
        status: 400,
        message: 'Blog does not exist',
      });
    }

    if (req.user.id !== blog.ownerId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 403,
        message: 'You are not authorized to delete this blog',
      });
    }

    await db.blog.delete({
      where: {
        id: req.params.blogId,
      },
    });

    return res.status(200).json({
      status: 200,
      message: 'Blog successfully deleted',
    });
  } catch (error) {
    return next(error);
  }
}

export { getBlogs, postBlog, putBlog, getBlog, deleteBlog };
