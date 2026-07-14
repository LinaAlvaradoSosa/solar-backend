type LocalDateParts = {
  year: number;
  month: number;
  day: number;
};

type LocalDateTimeParts = LocalDateParts & {
  hour: number;
  minute: number;
  second?: number;
};

function getFormatter(
  timeZone: string,
  includeWeekday = false
) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    ...(includeWeekday ? { weekday: 'short' } : {})
  });
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset'
  });
  const timeZoneName = formatter
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value;

  if (!timeZoneName) {
    throw new Error(`Missing time zone offset for ${timeZone}`);
  }

  if (timeZoneName === 'GMT') {
    return 0;
  }

  const match = timeZoneName.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    throw new Error(`Unexpected time zone format: ${timeZoneName}`);
  }

  const [, sign, hours, minutes = '00'] = match;
  const totalMinutes = Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
  return sign === '+' ? totalMinutes : -totalMinutes;
}

export function getZonedDateTimeParts(date: Date, timeZone: string) {
  const parts = getFormatter(timeZone, true).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number.parseInt(lookup.year, 10),
    month: Number.parseInt(lookup.month, 10),
    day: Number.parseInt(lookup.day, 10),
    hour: Number.parseInt(lookup.hour, 10),
    minute: Number.parseInt(lookup.minute, 10),
    second: Number.parseInt(lookup.second, 10),
    weekday: lookup.weekday
  };
}

export function zonedDateTimeToUtc(input: LocalDateTimeParts, timeZone: string) {
  let utcTimestamp = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second ?? 0
  );

  for (let index = 0; index < 3; index += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcTimestamp), timeZone);
    const adjustedTimestamp = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      input.second ?? 0
    ) - offsetMinutes * 60_000;

    if (adjustedTimestamp === utcTimestamp) {
      break;
    }

    utcTimestamp = adjustedTimestamp;
  }

  return new Date(utcTimestamp);
}

export function addLocalDays(date: LocalDateParts, days: number): LocalDateParts {
  const nextDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return {
    year: nextDate.getUTCFullYear(),
    month: nextDate.getUTCMonth() + 1,
    day: nextDate.getUTCDate()
  };
}

export function getLocalWeekday(date: LocalDateParts) {
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

export function isWeekday(date: LocalDateParts) {
  const weekday = getLocalWeekday(date);
  return weekday >= 1 && weekday <= 5;
}

export function formatInTimeZoneIso(date: Date, timeZone: string) {
  const parts = getZonedDateTimeParts(date, timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
  const offsetRemainder = String(absoluteMinutes % 60).padStart(2, '0');

  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}T${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}:${String(parts.second).padStart(2, '0')}${sign}${offsetHours}:${offsetRemainder}`;
}
