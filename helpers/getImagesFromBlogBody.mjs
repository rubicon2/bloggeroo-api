import * as regexp from './regexp.mjs';
import db from '../db/prismaClient.mjs';

export default async function getImagesFromBlogBody(body) {
  // Find all instances of a markdown string.
  const imageLinks = body.match(regexp.createStaticLinkRegExp('g'));

  // Extract file names from imageLinks with another regexp.
  const linkRegExp = regexp.createStaticFileNameRegExp();
  const fileNames = imageLinks.map((link) => link.match(linkRegExp)[0]);

  // Find on database.
  const images = await db.image.findMany({
    where: {
      fileName: {
        in: fileNames,
      },
    },
  });

  // Return database entries for those images.
  return images;
}
