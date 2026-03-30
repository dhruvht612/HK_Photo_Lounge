import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { publicUploadPath, uploadSingle } from '../middleware/upload.js';

const router = Router();

router.post('/', requireAuth, (req, res, next) => {
  uploadSingle.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const url = publicUploadPath(req.file.filename);
    res.status(201).json({ path: url, filename: req.file.filename });
  });
});

export default router;
