import db from '../db/prismaClient.mjs';
import getImagesFromBlogBody from '../helpers/getImagesFromBlogBody.mjs';
import formatValidationErrors from '../helpers/formatValidationErrors.mjs';
import { validationResult } from 'express-validator';

async function getPublishedBlogs(req, res, next) {
  try {
    const blogs = await db.blog.findMany({
      ...req.prismaQueryParams,
      where: {
        ...req.prismaQueryParams.where,
        publishedAt: {
          not: null,
          lte: new Date(Date.now()),
          ...req.prismaQueryParams.where?.publishedAt,
        },
      },
      include: {
        comments: true,
        owner: {
          select: {
            name: true,
            isAdmin: true,
            isBanned: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        blogs,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getAllBlogs(req, res, next) {
  try {
    const blogs = await db.blog.findMany({
      ...req.prismaQueryParams,
      include: {
        comments: true,
        owner: {
          select: {
            name: true,
            isAdmin: true,
            isBanned: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        blogs,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function postBlog(req, res, next) {
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
      status: 'success',
      data: {
        blog,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function putBlog(req, res, next) {
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
    const blog = await db.blog.findUnique({
      where: {
        id: req.params.blogId,
      },
    });

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'Blog not found',
        },
      });
    }

    if (req.user.id !== blog.ownerId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: 'You are not authorized to update this blog',
        },
      });
    }

    // Get image db entries from links in blog body and then connect blog to those db entries.
    const blogImages = await getImagesFromBlogBody(req.body.body);

    const updated = await db.blog.update({
      where: {
        id: req.params.blogId,
      },
      data: {
        ...req.body,
        images: {
          set: blogImages,
        },
      },
      include: {
        images: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        blog: updated,
      },
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
      include: {
        owner: {
          select: {
            name: true,
            isAdmin: true,
            isBanned: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'Blog not found',
        },
      });
    }

    const { user } = req;
    // Only give access if user is admin, or owner, or it is published.
    if (!blog.publishedAt && !user?.isAdmin && user?.id !== blog.ownerId) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: 'You do not have access to this blog',
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        blog,
      },
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
        status: 'fail',
        data: {
          message: 'Blog does not exist',
        },
      });
    }

    if (req.user.id !== blog.ownerId && !req.user.isAdmin) {
      return res.status(403).json({
        status: 'fail',
        data: {
          message: 'You are not authorized to delete this blog',
        },
      });
    }

    await db.blog.delete({
      where: {
        id: req.params.blogId,
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

export {
  getPublishedBlogs,
  getAllBlogs,
  postBlog,
  putBlog,
  getBlog,
  deleteBlog,
};
