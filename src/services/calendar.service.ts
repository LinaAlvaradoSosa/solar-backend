import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { formatInTimeZoneIso } from '../utils/timezone.js';

type BusyInterval = {
  startAt: Date;
  endAt: Date;
};

type CreateCalendarEventInput = {
  fullName: string;
  email: string;
  phone?: string;
  zipCode: string;
  addressRaw: string;
  startAt: Date;
  endAt: Date;
  timeZone: string;
};

type CalendarEventResult = {
  calendarEventId: string;
  status: string;
};

async function parseJsonResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || 'Google Calendar request failed';
    throw new AppError(response.status >= 500 ? 502 : 500, message);
  }

  return payload;
}

async function getGoogleAccessToken() {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_REFRESH_TOKEN
  ) {
    throw new AppError(503, 'Google Calendar is not configured yet');
  }

  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: env.GOOGLE_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const payload = await parseJsonResponse(response);

  if (!payload.access_token) {
    throw new AppError(502, 'Google Calendar access token was not returned');
  }

  return payload.access_token as string;
}

function getCalendarId() {
  if (!env.GOOGLE_CALENDAR_ID) {
    throw new AppError(503, 'Google Calendar ID is not configured yet');
  }

  return env.GOOGLE_CALENDAR_ID;
}

function buildCalendarDescription(input: CreateCalendarEventInput) {
  return [
    'SolarBuddy Premium Consultation',
    `Lead name: ${input.fullName}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone ?? 'N/A'}`,
    `ZIP: ${input.zipCode}`,
    `Address: ${input.addressRaw}`
  ].join('\n');
}

async function listGoogleBusyIntervals(timeMin: Date, timeMax: Date) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = getCalendarId();
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: env.CALENDAR_TIME_ZONE,
      items: [{ id: calendarId }]
    })
  });

  const payload = await parseJsonResponse(response);
  const busy = payload.calendars?.[calendarId]?.busy ?? [];

  return busy.map((interval: { start: string; end: string }) => ({
    startAt: new Date(interval.start),
    endAt: new Date(interval.end)
  })) as BusyInterval[];
}

async function createGoogleCalendarEvent(input: CreateCalendarEventInput) {
  const accessToken = await getGoogleAccessToken();
  const calendarId = getCalendarId();
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: 'SolarBuddy Premium Consultation',
        description: buildCalendarDescription(input),
        start: {
          dateTime: formatInTimeZoneIso(input.startAt, input.timeZone),
          timeZone: input.timeZone
        },
        end: {
          dateTime: formatInTimeZoneIso(input.endAt, input.timeZone),
          timeZone: input.timeZone
        },
        attendees: [
          {
            email: input.email,
            displayName: input.fullName
          }
        ]
      })
    }
  );

  const payload = await parseJsonResponse(response);
  if (!payload.id) {
    throw new AppError(502, 'Google Calendar did not return an event id');
  }

  return {
    calendarEventId: payload.id as string,
    status: String(payload.status ?? 'CONFIRMED').toUpperCase()
  } satisfies CalendarEventResult;
}

async function listMockBusyIntervals() {
  return [] as BusyInterval[];
}

async function createMockCalendarEvent(input: CreateCalendarEventInput) {
  return {
    calendarEventId: `mock-${input.startAt.getTime()}`,
    status: 'CONFIRMED'
  } satisfies CalendarEventResult;
}

export async function listExternalBusyIntervals(timeMin: Date, timeMax: Date) {
  if (env.CALENDAR_TRANSPORT === 'google') {
    return listGoogleBusyIntervals(timeMin, timeMax);
  }

  return listMockBusyIntervals();
}

export async function createExternalCalendarEvent(input: CreateCalendarEventInput) {
  if (env.CALENDAR_TRANSPORT === 'google') {
    return createGoogleCalendarEvent(input);
  }

  return createMockCalendarEvent(input);
}
