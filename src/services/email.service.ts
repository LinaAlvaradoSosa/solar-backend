import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import type { CreateLeadInput } from '../modules/leads/lead.schemas.js';

type HotLeadEmailInput = CreateLeadInput & {
  leadId: string;
  phone?: string | null;
  state?: string | null;
};

function buildPremiumLeadSubject(seriousness: number) {
  return `SolarBuddy Premium Lead (${seriousness}/10)`;
}

function buildLeadEmailHtml(lead: HotLeadEmailInput) {
  return `
    <h2>New SolarBuddy Premium Lead</h2>
    <p><strong>Lead ID:</strong> ${lead.leadId}</p>
    <p><strong>Name:</strong> ${lead.fullName}</p>
    <p><strong>Email:</strong> ${lead.email}</p>
    <p><strong>Phone:</strong> ${lead.phone ?? 'N/A'}</p>
    <p><strong>Address:</strong> ${lead.addressRaw}</p>
    <p><strong>City:</strong> ${lead.city ?? 'N/A'}</p>
    <p><strong>State:</strong> ${lead.state ?? 'N/A'}</p>
    <p><strong>ZIP:</strong> ${lead.zipCode}</p>
    <p><strong>Property Type:</strong> ${lead.propertyType ?? 'N/A'}</p>
    <p><strong>Monthly Bill:</strong> ${lead.monthlyBill ?? 'N/A'}</p>
    <p><strong>Service Type:</strong> ${lead.serviceType ?? 'N/A'}</p>
    <p><strong>House Specs:</strong> ${lead.houseSpecs ?? 'N/A'}</p>
    <p><strong>Seriousness:</strong> ${lead.seriousness}/10</p>
    <p><strong>Energy Provider:</strong> ${lead.energyProvider ?? 'N/A'}</p>
    <p><strong>Consent:</strong> ${lead.consentGiven ? 'Yes' : 'No'}</p>
  `;
}

export async function sendHotLeadEmail(lead: HotLeadEmailInput) {
  if (env.EMAIL_TRANSPORT === 'console') {
    console.log('Premium lead email payload', {
      to: env.HOT_LEAD_EMAIL_TO,
      from: env.HOT_LEAD_EMAIL_FROM,
      subject: buildPremiumLeadSubject(lead.seriousness),
      html: buildLeadEmailHtml(lead)
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER && env.SMTP_PASS
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      : undefined
  });

  await transporter.sendMail({
    to: env.HOT_LEAD_EMAIL_TO,
    from: env.HOT_LEAD_EMAIL_FROM,
    subject: buildPremiumLeadSubject(lead.seriousness),
    html: buildLeadEmailHtml(lead)
  });
}
