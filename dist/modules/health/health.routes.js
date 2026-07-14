import { Router } from 'express';
export const healthRouter = Router();
healthRouter.get('/', (_request, response) => {
    response.json({
        success: true,
        message: 'Solar backend is running'
    });
});
