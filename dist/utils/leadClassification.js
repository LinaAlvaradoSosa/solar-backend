import { LeadBucket, ServiceAreaStatus } from '@prisma/client';
import { WESTERN_COLORADO_ZIP_CODES } from '../constants/serviceArea.js';
export function normalizeZipCode(zipCode) {
    return zipCode.replace(/\D/g, '').slice(0, 5);
}
export function classifyLeadLocation(zipCode) {
    const normalizedZip = normalizeZipCode(zipCode);
    if (WESTERN_COLORADO_ZIP_CODES.has(normalizedZip)) {
        return {
            zipCode: normalizedZip,
            state: 'CO',
            serviceAreaStatus: ServiceAreaStatus.WESTERN_CO_TARGET,
            leadBucket: LeadBucket.TARGET
        };
    }
    return {
        zipCode: normalizedZip,
        state: null,
        serviceAreaStatus: ServiceAreaStatus.UNKNOWN,
        leadBucket: LeadBucket.OTHER_LEAD
    };
}
export function isHotLead(seriousness) {
    return seriousness >= 7;
}
