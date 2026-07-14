import { z } from 'zod';

const optionalTextField = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();
  return normalizedValue === '' ? undefined : normalizedValue;
}, z.string().optional());

const addressField = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalizedValue = value.trim();
  if (
    normalizedValue === '' ||
    /^skip$/i.test(normalizedValue) ||
    /^n\/a$/i.test(normalizedValue)
  ) {
    return 'N/A';
  }

  return normalizedValue;
}, z.string().default('N/A'));

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: optionalTextField,
  propertyType: optionalTextField,
  monthlyBill: optionalTextField,
  addressRaw: addressField,
  city: optionalTextField,
  zipCode: z.string().trim().min(5, 'ZIP code is required'),
  serviceType: optionalTextField,
  houseSpecs: optionalTextField,
  seriousness: z.number().int().min(1).max(10),
  energyProvider: optionalTextField,
  consentGiven: z.boolean().refine((value) => value === true, {
    message: 'Consent is required'
  }),
  consentText: z.string().trim().min(5, 'Consent text should be stored'),
  notes: optionalTextField
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
