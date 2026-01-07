import createStaticUrl from '../helpers/createStaticUrl.mjs';
import formatValidationErrors from '../helpers/formatValidationErrors.mjs';
import db from '../db/prismaClient.mjs';
import * as volume from '../helpers/volume.mjs';
import { validationResult, matchedData } from 'express-validator';
import fs from 'node:fs/promises';

async function getImages(req, res, next) {
  try {
    const images = await db.image.findMany();

    return res.json({
      status: 'success',
      data: {
        images: images.map((image) => ({
          ...image,
          url: createStaticUrl(image.fileName),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getImage(req, res, next) {
  try {
    const image = await db.image.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!image) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'Image not found',
        },
      });
    }

    return res.json({
      status: 'success',
      data: {
        image: {
          ...image,
          url: createStaticUrl(image.fileName),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function postImage(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty() || !req.file) {
      // If image uploaded by multer, delete it. Otherwise there will be a file on
      // the volume which we have no db entry for and won't be able to delete easily.
      if (req.file) {
        await volume.deleteFile(req.file.filename);
      }

      const validationErrors = result.array();

      // Validator can only do strings - need to check for the file manually here.
      if (!req.file) {
        validationErrors.push({
          path: 'image',
          msg: 'An image is required',
        });
      }

      return res.status(400).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(validationErrors),
        },
      });
    }

    const { altText, displayName } = matchedData(req);

    // Create entry on database. Url should not contain entire path but just internal to volume.
    // That way, if the volume changes, the url will still be correct and not hardcoded into the db entries.
    const image = await db.image.create({
      data: {
        ownerId: req.user.id,
        fileName: req.file.filename,
        displayName,
        altText,
      },
    });

    return res.json({
      status: 'success',
      data: {
        message: 'Image posted successfully',
        image: {
          ...image,
          url: createStaticUrl(image.fileName),
        },
        file: req.file,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function putImage(req, res, next) {
  try {
    // Check image id exists before bothering to do anything else.
    const existingImage = await db.image.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existingImage) {
      return res.status(404).json({
        status: 'fail',
        data: {
          message: 'That image does not exist',
        },
      });
    }

    const validation = validationResult(req);

    if (!validation.isEmpty()) {
      // If a new image has been uploaded, delete it.
      // The db entry won't get updated, so it needs to go.
      if (req.file) {
        await volume.deleteFile(req.file.filename);
      }

      return res.status(400).json({
        status: 'fail',
        data: {
          validationErrors: formatValidationErrors(validation.array()),
        },
      });
    }

    const data = matchedData(req);

    // If a new image has been uploaded, delete the old one from the volume, then update the db.
    if (req.file) {
      await volume.deleteFile(existingImage.fileName);
      // Add onto matched data so the db entry gets updated with the new file name.
      data.fileName = req.file.filename;
    }

    const updated = await db.image.update({
      where: {
        id: req.params.id,
      },
      data,
    });

    return res.json({
      status: 'success',
      data: {
        message: 'Image successfully updated',
        image: {
          ...updated,
          url: createStaticUrl(updated.fileName),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export { getImages, getImage, postImage, putImage };
