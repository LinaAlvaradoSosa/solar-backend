import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { formatInTimeZoneIso } from '../utils/timezone.js';
async function parseJsonResponse(response) {
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = payload?.error?.message || payload?.message || 'Google Calendar request failed';
        throw new AppError(response.status >= 500 ? 502 : 500, message);
    }
    return payload;
}
async function getGoogleAccessToken() {
    if (!env.GOOGLE_CLIENT_ID ||
        !env.GOOGLE_CLIENT_SECRET ||
        !env.GOOGLE_REFRESH_TOKEN) {
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
    return payload.access_token;
}
function getCalendarId() {
    if (!env.GOOGLE_CALENDAR_ID) {
        throw new AppError(503, 'Google Calendar ID is not configured yet');
    }
    return env.GOOGLE_CALENDAR_ID;
}
function buildCalendarDescription(input) {
    return [
        'SolarBuddy Premium Consultation',
        `Lead name: ${input.fullName}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone ?? 'N/A'}`,
        `ZIP: ${input.zipCode}`,
        `Address: ${input.addressRaw}`
    ].join('\n');
}
async function listGoogleBusyIntervals(timeMin, timeMax) {
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
    return busy.map((interval) => ({
        startAt: new Date(interval.start),
        endAt: new Date(interval.end)
    }));
}
async function createGoogleCalendarEvent(input) {
    const accessToken = await getGoogleAccessToken();
    const calendarId = getCalendarId();
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`, {
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
    });
    const payload = await parseJsonResponse(response);
    if (!payload.id) {
        throw new AppError(502, 'Google Calendar did not return an event id');
    }
    return {
        calendarEventId: payload.id,
        status: String(payload.status ?? 'CONFIRMED').toUpperCase()
    };
}
async function listMockBusyIntervals() {
    return [];
}
async function createMockCalendarEvent(input) {
    return {
        calendarEventId: `mock-${input.startAt.getTime()}`,
        status: 'CONFIRMED'
    };
}
export async function listExternalBusyIntervals(timeMin, timeMax) {
    if (env.CALENDAR_TRANSPORT === 'google') {
        return listGoogleBusyIntervals(timeMin, timeMax);
    }
    return listMockBusyIntervals();
}
export async function createExternalCalendarEvent(input) {
    if (env.CALENDAR_TRANSPORT === 'google') {
        return createGoogleCalendarEvent(input);
    }
    return createMockCalendarEvent(input);
}
