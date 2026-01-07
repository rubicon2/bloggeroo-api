function createStaticUrl(filename) {
  return `${process.env.SERVER_BASE_URL}${process.env.SERVER_STATIC_DIR}/${filename}`;
}

export default createStaticUrl;
