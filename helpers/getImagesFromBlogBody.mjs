import * as regexp from './regexp.mjs';
import db from '../db/prismaClient.mjs';

export default async function getImagesFromBlogBody(body) {
  // Find all instances of a markdown image link that points to the static directory.
  // Not interested in urls to external images, etc.
  const markdownImageLinks = body.match(
    regexp.createMarkdownStaticImageLinkRegExp('g'),
  );

  // Extract http urls from markdown links.
  const urlLinkRegExp = regexp.createMarkdownUrlRegExp('g');
  const urlLinks = markdownImageLinks
    ? markdownImageLinks.map(
        (markdownImageLink) => markdownImageLink.match(urlLinkRegExp)[0],
      )
    : [];

  // Extract file names from urls with another regexp.
  const linkRegExp = regexp.createFileNameRegExp();
  const fileNames = urlLinks
    ? urlLinks.map((link) => link.match(linkRegExp)[0])
    : [];

  // Find on database.
  const images = await db.image.findMany({
    where: {
      fileName: {
        in: fileNames,
      },
    },
  });

  return images;
}
