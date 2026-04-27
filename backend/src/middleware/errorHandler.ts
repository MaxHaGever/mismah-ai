import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: 'קובץ גדול מדי. אפשר להעלות קבצים עד 5MB.' });
        return;
    }

    if (err.message.includes('Unsupported file type')) {
        res.status(400).json({ error: err.message });
        return;
    }

    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
};
