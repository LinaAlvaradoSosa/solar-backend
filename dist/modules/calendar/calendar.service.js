import { AppointmentStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/app-error.js';
import { prisma } from '../../lib/prisma.js';
import { createExternalCalendarEvent, listExternalBusyIntervals } from '../../services/calendar.service.js';
import { addLocalDays, formatInTimeZoneIso, getLocalWeekday, getZonedDateTimeParts, isWeekday, zonedDateTimeToUtc } from '../../utils/timezone.js';
function buildDateRange(range) {
    const nowParts = getZonedDateTimeParts(new Date(), env.CALENDAR_TIME_ZONE);
    const today = {
        year: nowParts.year,
        month: nowParts.month,
        day: nowParts.day
    };
    const tomorrow = addLocalDays(today, 1);
    if (range === 'Tomorrow') {
        return isWeekday(tomorrow) ? [tomorrow] : [];
    }
    if (range === 'This Week') {
        const dates = [];
        let cursor = tomorrow;
        while (getLocalWeekday(cursor) !== 6 && getLocalWeekday(cursor) !== 0) {
            if (isWeekday(cursor)) {
                dates.push(cursor);
            }
            cursor = addLocalDays(cursor, 1);
        }
        return dates;
    }
    const currentWeekday = getLocalWeekday(today);
    const daysUntilNextMonday = ((8 - currentWeekday) % 7) || 7;
    const nextMonday = addLocalDays(today, daysUntilNextMonday);
    return Array.from({ length: 5 }, (_, index) => addLocalDays(nextMonday, index));
}
function buildWorkingWindows(dates) {
    return dates.map((date) => ({
        startAt: zonedDateTimeToUtc({
            ...date,
            hour: env.CALENDAR_WORKDAY_START_HOUR,
            minute: 0,
            second: 0
        }, env.CALENDAR_TIME_ZONE),
        endAt: zonedDateTimeToUtc({
            ...date,
            hour: env.CALENDAR_WORKDAY_END_HOUR,
            minute: 0,
            second: 0
        }, env.CALENDAR_TIME_ZONE)
    }));
}
function intervalsOverlap(left, right) {
    return left.startAt < right.endAt && right.startAt < left.endAt;
}
async function listBusyIntervalsForRange(range) {
    const [externalBusy, internalBusy] = await Promise.all([
        listExternalBusyIntervals(range.startAt, range.endAt),
        prisma.appointment.findMany({
            where: {
                status: AppointmentStatus.CONFIRMED,
                startAt: { lt: range.endAt },
                endAt: { gt: range.startAt }
            }
        })
    ]);
    return [
        ...externalBusy,
        ...internalBusy.map((appointment) => ({
            startAt: appointment.startAt,
            endAt: appointment.endAt
        }))
    ];
}
function buildSlotsForWindow(window, busyIntervals) {
    const slots = [];
    const slotDurationMs = env.CALENDAR_SLOT_DURATION_MINUTES * 60_000;
    const now = new Date();
    for (let cursor = window.startAt.getTime(); cursor + slotDurationMs <= window.endAt.getTime(); cursor += slotDurationMs) {
        const slot = {
            startAt: new Date(cursor),
            endAt: new Date(cursor + slotDurationMs)
        };
        if (slot.startAt <= now) {
            continue;
        }
        if (busyIntervals.some((busyInterval) => intervalsOverlap(slot, busyInterval))) {
            continue;
        }
        slots.push(formatInTimeZoneIso(slot.startAt, env.CALENDAR_TIME_ZONE));
    }
    return slots;
}
function validateSlotWithinRules(startAt, endAt) {
    const startParts = getZonedDateTimeParts(startAt, env.CALENDAR_TIME_ZONE);
    const endParts = getZonedDateTimeParts(endAt, env.CALENDAR_TIME_ZONE);
    if (!isWeekday(startParts)) {
        throw new AppError(400, 'Selected slot must be on a weekday');
    }
    if (startParts.hour < env.CALENDAR_WORKDAY_START_HOUR ||
        endParts.hour > env.CALENDAR_WORKDAY_END_HOUR ||
        (endParts.hour === env.CALENDAR_WORKDAY_END_HOUR && endParts.minute > 0)) {
        throw new AppError(400, 'Selected slot is outside working hours');
    }
    if (startParts.minute % env.CALENDAR_SLOT_DURATION_MINUTES !== 0) {
        throw new AppError(400, 'Selected slot must align with 15-minute increments');
    }
    if (startAt <= new Date()) {
        throw new AppError(400, 'Selected slot must be in the future');
    }
}
async function ensureSlotIsAvailable(startAt, endAt) {
    const busyIntervals = await listBusyIntervalsForRange({ startAt, endAt });
    const isUnavailable = busyIntervals.some((busyInterval) => intervalsOverlap({ startAt, endAt }, busyInterval));
    if (isUnavailable) {
        throw new AppError(409, 'That time slot is no longer available');
    }
}
export async function getAvailability(input) {
    const dates = buildDateRange(input.range);
    if (dates.length === 0) {
        return {
            slots: []
        };
    }
    const windows = buildWorkingWindows(dates);
    const range = {
        startAt: windows[0].startAt,
        endAt: windows[windows.length - 1].endAt
    };
    const busyIntervals = await listBusyIntervalsForRange(range);
    return {
        slots: windows.flatMap((window) => buildSlotsForWindow(window, busyIntervals))
    };
}
export async function bookAppointment(input) {
    if (input.durationMinutes !== env.CALENDAR_SLOT_DURATION_MINUTES) {
        throw new AppError(400, `Appointment duration must be ${env.CALENDAR_SLOT_DURATION_MINUTES} minutes`);
    }
    const lead = await prisma.lead.findUnique({
        where: {
            id: input.leadId
        }
    });
    if (!lead) {
        throw new AppError(404, 'Lead not found');
    }
    if (!lead.isHotLead) {
        throw new AppError(403, 'Only premium leads can book an appointment');
    }
    const startAt = new Date(input.selectedSlot);
    const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
    validateSlotWithinRules(startAt, endAt);
    await ensureSlotIsAvailable(startAt, endAt);
    try {
        const event = await createExternalCalendarEvent({
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            zipCode: input.zipCode,
            addressRaw: input.addressRaw,
            startAt,
            endAt,
            timeZone: env.CALENDAR_TIME_ZONE
        });
        await prisma.appointment.create({
            data: {
                leadId: input.leadId,
                fullName: input.fullName,
                email: input.email,
                phone: input.phone,
                zipCode: input.zipCode,
                addressRaw: input.addressRaw,
                startAt,
                endAt,
                timeZone: env.CALENDAR_TIME_ZONE,
                calendarEventId: event.calendarEventId,
                status: AppointmentStatus.CONFIRMED
            }
        });
        return {
            calendarEventId: event.calendarEventId,
            status: event.status,
            startAt: formatInTimeZoneIso(startAt, env.CALENDAR_TIME_ZONE),
            endAt: formatInTimeZoneIso(endAt, env.CALENDAR_TIME_ZONE)
        };
    }
    catch (error) {
        if (!(error instanceof AppError)) {
            await prisma.appointment.create({
                data: {
                    leadId: input.leadId,
                    fullName: input.fullName,
                    email: input.email,
                    phone: input.phone,
                    zipCode: input.zipCode,
                    addressRaw: input.addressRaw,
                    startAt,
                    endAt,
                    timeZone: env.CALENDAR_TIME_ZONE,
                    status: AppointmentStatus.FAILED
                }
            });
        }
        throw error;
    }
}
