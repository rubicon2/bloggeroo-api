function createStaticLinkRegExp(flags) {
  return new RegExp(
    // String given to RegExp needs to be DOUBLE ESCAPED. The first \ gets consumed by string parser.
    // If eslint gives a no-useless-escape character, then it probably means you need another backslash!
    `!\\[[^\\]]*\\]\\((http:\\/\\/|https:\\/\\/)?${process.env.SERVER_BASE_URL}\\${process.env.SERVER_STATIC_DIR}\\/[^\\)]+\\)`,
    flags,
  );
}

function createStaticFileNameRegExp(flags) {
  return new RegExp(`(?<=\\/)[^\\.\\/]+\\.\\w+`, flags);
}

export { createStaticLinkRegExp, createStaticFileNameRegExp };
