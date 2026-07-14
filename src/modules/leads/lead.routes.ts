import { Router } from 'express';
import {
  createLeadHandler,
  getLeadStatsHandler,
  listLeadsHandler
} from './lead.controller.js';

export const leadRouter = Router();

leadRouter.post('/', createLeadHandler);
leadRouter.get('/', listLeadsHandler);
leadRouter.get('/stats', getLeadStatsHandler);
