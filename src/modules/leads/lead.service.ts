import { prisma } from '../../lib/prisma.js';
import { sendHotLeadEmail } from '../../services/email.service.js';
import { classifyLeadLocation, isHotLead } from '../../utils/leadClassification.js';
import type { CreateLeadInput, LeadQueryInput } from './lead.schemas.js';

export async function createLead(input: CreateLeadInput) {
  const location = classifyLeadLocation(input.zipCode);
  const hotLead = isHotLead(input.seriousness);

  const lead = await prisma.lead.create({
    data: {
      ...input,
      zipCode: location.zipCode,
      state: location.state,
      consentedAt: new Date(),
      serviceAreaStatus: location.serviceAreaStatus,
      leadBucket: location.leadBucket,
      isHotLead: hotLead
    }
  });

  await prisma.leadEvent.create({
    data: {
      leadId: lead.id,
      eventType: 'lead.created',
      payload: JSON.stringify({
        seriousness: lead.seriousness,
        serviceAreaStatus: lead.serviceAreaStatus,
        isHotLead: lead.isHotLead
      })
    }
  });

  if (hotLead) {
    await sendHotLeadEmail({
      ...input,
      state: location.state,
      zipCode: location.zipCode,
      leadId: lead.id
    });

    await prisma.lead.update({
      where: {
        id: lead.id
      },
      data: {
        emailedAt: new Date()
      }
    });
  }

  return lead;
}

export async function listLeads(query: LeadQueryInput) {
  return prisma.lead.findMany({
    where: {
      isHotLead: query.filter === 'hot' ? true : undefined,
      leadBucket: query.filter === 'target'
        ? 'TARGET'
        : query.filter === 'out_of_area'
          ? 'OTHER_LEAD'
          : undefined,
      seriousness: query.seriousnessMin || query.seriousnessMax
        ? {
            gte: query.seriousnessMin,
            lte: query.seriousnessMax
          }
        : undefined,
      serviceAreaStatus: query.serviceAreaStatus
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getLeadStats() {
  const [total, hot, target, outOfArea, completed] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { isHotLead: true } }),
    prisma.lead.count({ where: { leadBucket: 'TARGET' } }),
    prisma.lead.count({ where: { leadBucket: 'OTHER_LEAD' } }),
    prisma.lead.count({ where: { status: 'COMPLETED' } })
  ]);

  return {
    total,
    hot,
    target,
    outOfArea,
    completed
  };
}
