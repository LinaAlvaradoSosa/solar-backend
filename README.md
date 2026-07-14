# Solar Backend

Backend demo for Solar Buddy lead capture.

## Stack

- TypeScript
- Express
- Prisma
- SQLite
- Nodemailer
- Zod

## What this demo supports

- Create leads from the frontend flow
- Validate required demo fields
- Bucket leads into `TARGET` or `OTHER_LEAD`
- Identify Western Colorado ZIP codes
- Auto-trigger email notifications for leads with seriousness `7-10`
- List leads for a simple table dashboard
- Filter leads by hot, target, and out-of-area
- Return summary stats for dashboard cards

## Required frontend payload

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "9705551234",
  "propertyType": "Private Residence",
  "monthlyBill": "$250 - $500",
  "addressRaw": "123 Main St",
  "city": "Grand Junction",
  "state": "CO",
  "zipCode": "81501",
  "serviceType": "Full Installation",
  "houseSpecs": "1800 sqft, roof unknown",
  "seriousness": 8,
  "energyProvider": "Xcel Energy",
  "consentGiven": true,
  "consentText": "I consent to storage of my information."
}
```

## Routes

- `GET /api/health`
- `POST /api/leads`
- `GET /api/leads`
- `GET /api/leads/stats`

## Filters

Examples:

- `/api/leads?filter=all`
- `/api/leads?filter=hot`
- `/api/leads?filter=target`
- `/api/leads?filter=out_of_area`

## Local setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Run `npx prisma generate`
4. Run `npx prisma migrate dev --name init`
5. Start the server with `npm run dev`

## Notes

- `EMAIL_TRANSPORT=console` logs hot lead emails to the terminal for demo use.
- Switch to `EMAIL_TRANSPORT=smtp` when you have real SMTP credentials.
