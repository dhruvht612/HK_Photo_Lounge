import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const DB_PATH = process.env.DB_PATH || './data/hk_photo.db';
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
