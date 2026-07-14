import { z } from 'zod';

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  propertyType: z.string().trim().optional(),
  monthlyBill: z.string().trim().optional(),
  addressRaw: z.string().trim().min(5, 'Address is required'),
  city: z.string().trim().optional(),
  zipCode: z.string().trim().min(5, 'ZIP code is required'),
  serviceType: z.string().trim().optional(),
  houseSpecs: z.string().trim().optional(),
  seriousness: z.number().int().min(1).max(10),
  energyProvider: z.string().trim().optional(),
  consentGiven: z.boolean().refine((value) => value === true, {
    message: 'Consent is required'
  }),
  consentText: z.string().trim().min(5, 'Consent text should be stored'),
  notes: z.string().trim().optional()
});

export const leadQuerySchema = z.object({
  filter: z.enum(['all', 'hot', 'target', 'out_of_area']).default('all'),
  seriousnessMin: z.coerce.number().int().min(1).max(10).optional(),
  seriousnessMax: z.coerce.number().int().min(1).max(10).optional(),
  serviceAreaStatus: z
    .enum(['WESTERN_CO_TARGET', 'OTHER_CO', 'OUT_OF_STATE', 'UNKNOWN'])
    .optional()
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
