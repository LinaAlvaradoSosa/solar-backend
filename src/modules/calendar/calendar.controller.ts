import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../lib/app-error.js';
import {
  availabilitySchema,
  bookAppointmentSchema,
  listBookingDaysSchema
} from './calendar.schemas.js';
import {
  bookAppointment,
  getAvailability,
  listBookingDays
} from './calendar.service.js';

function handleControllerError(error: unknown, response: Response, fallbackMessage: string) {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      errors: error.flatten()
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  response.status(500).json({
    success: false,
    message: fallbackMessage
  });
}

export async function getAvailabilityHandler(request: Request, response: Response) {
  try {
    const payload = availabilitySchema.parse(request.body);
    const availability = await getAvailability(payload);

    response.json({
      success: true,
      data: availability
    });
  } catch (error) {
    handleControllerError(error, response, 'Failed to fetch availability');
  }
}

export async function listBookingDaysHandler(request: Request, response: Response) {
  try {
    listBookingDaysSchema.parse(request.query);
    const days = await listBookingDays();

    response.json({
      success: true,
      data: {
        days
      }
    });
  } catch (error) {
    handleControllerError(error, response, 'Failed to fetch booking days');
  }
}

export async function bookAppointmentHandler(request: Request, response: Response) {
  try {
    const payload = bookAppointmentSchema.parse(request.body);
    const booking = await bookAppointment(payload);

    response.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    handleControllerError(error, response, 'Failed to book appointment');
  }
}
