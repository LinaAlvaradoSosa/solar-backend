import { ZodError } from 'zod';
import { createLeadSchema, leadQuerySchema } from './lead.schemas.js';
import { createLead, getLeadStats, listLeads } from './lead.service.js';
export async function createLeadHandler(request, response) {
    try {
        const payload = createLeadSchema.parse(request.body);
        const lead = await createLead(payload);
        response.status(201).json({
            success: true,
            data: lead
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            response.status(400).json({
                success: false,
                errors: error.flatten()
            });
            return;
        }
        response.status(500).json({
            success: false,
            message: 'Failed to create lead'
        });
    }
}
export async function listLeadsHandler(request, response) {
    try {
        const query = leadQuerySchema.parse(request.query);
        const leads = await listLeads(query);
        response.json({
            success: true,
            data: leads
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            response.status(400).json({
                success: false,
                errors: error.flatten()
            });
            return;
        }
        response.status(500).json({
            success: false,
            message: 'Failed to fetch leads'
        });
    }
}
export async function getLeadStatsHandler(_request, response) {
    try {
        const stats = await getLeadStats();
        response.json({
            success: true,
            data: stats
        });
    }
    catch {
        response.status(500).json({
            success: false,
            message: 'Failed to fetch lead stats'
        });
    }
}
