import { describe, it, expect } from "vitest";
import {
  calculateAge,
  calculateDateDifference,
  parseIsoDate,
  isLeapYear,
} from "@/features/date-tools/dateMath";

describe("dateMath", () => {
  it("handles leap year rules properly", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2024)).toBe(true);
    expect(parseIsoDate("2025-02-29")).toBeNull();
    expect(parseIsoDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
  });

  it("calculates exclusive vs inclusive date difference and reversed dates", () => {
    const start = parseIsoDate("2026-01-01")!;
    const same = parseIsoDate("2026-01-01")!;
    expect(calculateDateDifference(start, same, false).totalDays).toBe(0);
    expect(calculateDateDifference(start, same, true).totalDays).toBe(1);

    const end = parseIsoDate("2026-01-31")!;
    expect(calculateDateDifference(start, end, false).totalDays).toBe(30);
    expect(calculateDateDifference(start, end, true)).toMatchObject({
      years: 0,
      months: 1,
      days: 0,
      totalDays: 31,
    });

    const rev = calculateDateDifference(end, start, false);
    expect(rev.reversed).toBe(true);
    expect(rev.totalDays).toBe(30);
  });

  it("calculates Feb-29 birthdays across non-leap years and rejects future birthdates", () => {
    const bday = parseIsoDate("2000-02-29")!;
    const asOf = parseIsoDate("2025-02-28")!;
    const mar1Rule = calculateAge(bday, asOf, "mar-1")!;
    expect(mar1Rule.isFeb29Birthday).toBe(true);
    expect(mar1Rule.nextBirthdayIso).toBe("2025-03-01");
    expect(mar1Rule.daysUntilNextBirthday).toBe(1);

    const future = calculateAge(parseIsoDate("2030-01-01")!, asOf);
    expect(future).toBeNull();
  });
});

