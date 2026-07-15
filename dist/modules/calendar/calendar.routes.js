import { Router } from 'express';
import { bookAppointmentHandler, getAvailabilityHandler, listBookingDaysHandler } from './calendar.controller.js';
export const calendarRouter = Router();
calendarRouter.get('/days', listBookingDaysHandler);
calendarRouter.post('/availability', getAvailabilityHandler);
calendarRouter.post('/book', bookAppointmentHandler);
