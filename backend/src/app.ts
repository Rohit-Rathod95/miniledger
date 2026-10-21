import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/error';
import { authRouter } from './routes/auth';
import { loansRouter } from './routes/loans';
import { summaryRouter } from './routes/summary';

export function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', service: 'miniledger-backend' });
    });

    // Routes get mounted here as we build them.
    app.use('/auth', authRouter);
    app.use('/loans', loansRouter);
    app.use('/summary', summaryRouter);

    app.use(errorHandler);
    return app;
}
