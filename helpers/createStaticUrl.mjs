function createStaticUrl(filename) {
  return new URL(
    `${process.env.SERVER_STATIC_DIR}/${filename}`,
    process.env.SERVER_BASE_URL,
  );
}

export default createStaticUrl;
