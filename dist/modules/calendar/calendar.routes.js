import { Router } from 'express';
import { bookAppointmentHandler, getAvailabilityHandler } from './calendar.controller.js';
export const calendarRouter = Router();
calendarRouter.post('/availability', getAvailabilityHandler);
calendarRouter.post('/book', bookAppointmentHandler);
