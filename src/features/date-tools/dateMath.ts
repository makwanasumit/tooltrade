export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface CalendarSpan {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  remainingDaysAfterWeeks: number;
  reversed: boolean;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  const standard = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeapYear(year)) return 29;
  return standard[month - 1] ?? 30;
}

export function parseIsoDate(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  return { year, month, day };
}

export function formatIsoDate(d: CalendarDate): string {
  return `${String(d.year).padStart(4, "0")}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function toUtcDays(d: CalendarDate): number {
  return Math.floor(Date.UTC(d.year, d.month - 1, d.day) / 86_400_000);
}

export function calculateDateDifference(
  startInput: CalendarDate,
  endInput: CalendarDate,
  inclusive = false,
): CalendarSpan {
  const cmp = compareCalendarDates(startInput, endInput);
  const reversed = cmp > 0;
  const start = reversed ? endInput : startInput;
  const end = reversed ? startInput : endInput;

  let years = end.year - start.year;
  let months = end.month - start.month;
  let days = end.day - start.day;

  if (days < 0) {
    months -= 1;
    const prevMonth = end.month === 1 ? 12 : end.month - 1;
    const prevMonthYear = end.month === 1 ? end.year - 1 : end.year;
    // Clamp start.day if start.day exceeded prevMonth length (e.g. Jan 31 -> Feb 28)
    const prevDays = daysInMonth(prevMonthYear, prevMonth);
    days = prevDays - Math.min(start.day, prevDays) + end.day;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const elapsedDays = toUtcDays(end) - toUtcDays(start);
  const totalDays = inclusive ? elapsedDays + 1 : elapsedDays;

  if (inclusive) {
    days += 1;
    const refMonthDays = daysInMonth(end.year, end.month);
    if (days >= refMonthDays && start.day === 1 && end.day === refMonthDays) {
      days = 0;
      months += 1;
      if (months >= 12) {
        months -= 12;
        years += 1;
      }
    }
  }

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    remainingDaysAfterWeeks: totalDays % 7,
    reversed,
  };
}

export interface AgeResult {
  span: CalendarSpan;
  daysUntilNextBirthday: number;
  nextBirthdayIso: string;
  isFeb29Birthday: boolean;
}

export function calculateAge(
  birthDate: CalendarDate,
  asOfDate: CalendarDate,
  feb29NonLeapRule: "mar-1" | "feb-28" = "mar-1",
): AgeResult | null {
  if (compareCalendarDates(birthDate, asOfDate) > 0) {
    return null;
  }

  const span = calculateDateDifference(birthDate, asOfDate, false);
  const isFeb29Birthday = birthDate.month === 2 && birthDate.day === 29;

  const resolveBirthdayInYear = (yr: number): CalendarDate => {
    if (isFeb29Birthday && !isLeapYear(yr)) {
      return feb29NonLeapRule === "feb-28"
        ? { year: yr, month: 2, day: 28 }
        : { year: yr, month: 3, day: 1 };
    }
    return { year: yr, month: birthDate.month, day: birthDate.day };
  };

  let nextBday = resolveBirthdayInYear(asOfDate.year);
  if (compareCalendarDates(nextBday, asOfDate) <= 0) {
    nextBday = resolveBirthdayInYear(asOfDate.year + 1);
  }

  const daysUntilNextBirthday = toUtcDays(nextBday) - toUtcDays(asOfDate);

  return {
    span,
    daysUntilNextBirthday,
    nextBirthdayIso: formatIsoDate(nextBday),
    isFeb29Birthday,
  };
}

