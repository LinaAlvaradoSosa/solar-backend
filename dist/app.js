import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRouter } from './modules/health/health.routes.js';
import { leadRouter } from './modules/leads/lead.routes.js';
export const app = express();
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));
app.get('/', (_request, response) => {
    response.json({
        success: true,
        name: 'Solar Buddy Backend Demo',
        version: '1.0.0'
    });
});
app.use('/api/health', healthRouter);
app.use('/api/leads', leadRouter);
