import { z } from 'zod';
export const listBookingDaysSchema = z.object({});
export const availabilitySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
});
export const bookAppointmentSchema = z.object({
    leadId: z.string().trim().min(1, 'Lead id is required'),
    fullName: z.string().trim().min(2, 'Full name is required'),
    email: z.string().trim().email('Valid email is required'),
    phone: z.string().trim().optional(),
    zipCode: z.string().trim().min(5, 'ZIP code is required'),
    addressRaw: z.string().trim().default('N/A'),
    selectedSlot: z.string().datetime({ offset: true }),
    durationMinutes: z.number().int().positive()
});
