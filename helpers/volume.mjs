import fs from 'node:fs/promises';

async function deleteFile(filepath) {
  await fs.rm(`${process.env.VOLUME_MOUNT_PATH}/${filepath}`);
}

export { deleteFile };
