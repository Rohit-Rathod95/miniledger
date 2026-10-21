import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';

export function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'miniledger-backend' });
    });

    // Routes get mounted here as we build them.

    app.use(errorHandler);
    return app;
}
