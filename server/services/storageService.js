const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PHOTOS_DIR = path.join(UPLOADS_DIR, 'photos');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

// Ensure directories
[UPLOADS_DIR, PHOTOS_DIR, AVATARS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

class LocalStorageProvider {
  /**
   * Saves a file buffer or stream to local uploads folder
   * @param {Object} options - { buffer, filename, mimeType, folder = 'photos' }
   * @returns {Promise<{ url: string, key: string, size: number }>}
   */
  async saveFile({ buffer, filename, folder = 'photos' }) {
    const ext = filename ? path.extname(filename) || '.jpg' : '.jpg';
    const uniqueKey = `${folder}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetDir = folder === 'avatars' ? AVATARS_DIR : PHOTOS_DIR;
    const filePath = path.join(targetDir, uniqueKey);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/uploads/${folder}/${uniqueKey}`,
      key: uniqueKey,
      folder,
      size: buffer.length
    };
  }

  /**
   * Saves a base64 encoded image string (e.g. data:image/jpeg;base64,...)
   * @param {string} base64String 
   * @param {string} folder 
   * @returns {Promise<{ url: string, key: string }>}
   */
  async saveBase64Image(base64String, folder = 'photos') {
    // Strip data URL prefix if present
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = '.jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = '.png';
      if (mime.includes('webp')) ext = '.webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64String, 'base64');
    }

    const uniqueKey = `${folder}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const targetDir = folder === 'avatars' ? AVATARS_DIR : PHOTOS_DIR;
    const filePath = path.join(targetDir, uniqueKey);

    await fs.promises.writeFile(filePath, buffer);

    return {
      url: `/uploads/${folder}/${uniqueKey}`,
      key: uniqueKey,
      folder,
      size: buffer.length
    };
  }

  /**
   * Delete a file if needed
   */
  async deleteFile(key, folder = 'photos') {
    const targetDir = folder === 'avatars' ? AVATARS_DIR : PHOTOS_DIR;
    const filePath = path.join(targetDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }
}

// Singleton storage service instance
// To switch to S3 later, simply create an S3StorageProvider implementing saveFile, saveBase64Image, deleteFile
const storageService = new LocalStorageProvider();

module.exports = storageService;
