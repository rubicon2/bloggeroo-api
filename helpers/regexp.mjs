import escapeStringRegexp from 'escape-string-regexp';

function createMarkdownStaticLinkRegExp(flags) {
  const escapedUrl = escapeStringRegexp(
    process.env.SERVER_BASE_URL + process.env.SERVER_STATIC_DIR,
  );
  // For finding markdown links to static directory on server as determined by env variables.
  return new RegExp(
    // String given to RegExp needs to be DOUBLE ESCAPED. The first \ gets consumed by string parser.
    // If eslint gives a no-useless-escape character, then it probably means you need another backslash!
    `!\\[.*\\]\\(${escapedUrl}\\/.+?\\)`,
    flags,
  );
}

function createMarkdownUrlRegExp(flags) {
  // Match the url within the ()!
  return new RegExp(`(?<=\\().*(?=\\))`, flags);
}

function createMarkdownImgLinkRegExp(link, altText, flags) {
  // For matching ![my alt text](https://my-website.com/static/my-link.png), etc.
  // Makes it easy to match and replace the whole link.
  return new RegExp(`!\\[${altText || '.*?'}\\]\\(${link}\\)`, flags);
}

function createFileNameRegExp(flags) {
  // For matching the filename at the end of a path.
  return new RegExp(`(?<=\\/)[^\\.\\/]+\\.\\w+$`, flags);
}

export {
  createMarkdownStaticLinkRegExp,
  createMarkdownUrlRegExp,
  createMarkdownImgLinkRegExp,
  createFileNameRegExp,
};
