import { z } from 'zod';
export const availabilitySchema = z.object({
    range: z.enum(['Tomorrow', 'This Week', 'Next Week'])
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
