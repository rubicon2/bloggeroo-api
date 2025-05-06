function formatValidationErrors(validationErrors) {
  // Hold an array of messages for easy iteration and listing.
  const formatted = { array: validationErrors.map((error) => error.msg) };
  // Map messages to the paths, so can easily assign messages to form fields.
  for (const error of validationErrors) {
    formatted[error.path] = error.msg;
  }
  return formatted;
}

export default formatValidationErrors;
