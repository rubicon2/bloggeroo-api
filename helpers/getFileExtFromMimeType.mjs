export default function getFileExtFromMimeType(mimeType) {
  // E.g. need to take into account stuff like: image/jpeg;extra-info, image/svg+xml.
  // Grab everything after / until there is a non alphanumeric character.
  const matches = mimeType.match(/(?<=\/)[a-zA-Z0-9]{1,}/i);
  // Match will either return an array or null.
  return matches !== null ? matches[0] : null;
}
