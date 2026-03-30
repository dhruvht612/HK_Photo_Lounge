import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { nanoid } from 'nanoid';
import { UPLOAD_DIR } from '../config/env.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.isAbsolute(UPLOAD_DIR)
  ? UPLOAD_DIR
  : path.join(__dirname, '../../', UPLOAD_DIR);

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${nanoid(12)}${ext}`);
  },
});

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowed.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
});

export function publicUploadPath(filename) {
  return `/uploads/${filename}`;
}
