import { plainToClass } from 'class-transformer';
import { DateRelativePipe } from './DateRelativePipe';

// Fix Date.now so all tests get a stable "now"
const NOW_MS = 1_750_000_000_000; // 2025-06-15T10:13:20Z (arbitrary fixed point)
const NOW_SEC = Math.floor(NOW_MS / 1000);

beforeAll(() => jest.spyOn(Date, 'now').mockReturnValue(NOW_MS));
afterAll(() => jest.restoreAllMocks());

function pipe(params: Partial<DateRelativePipe> = {}): DateRelativePipe {
  return plainToClass(DateRelativePipe, { type: 'date-relative', ...params });
}

function exec(value: string, params: Partial<DateRelativePipe> = {}): number {
  return pipe(params).exec(value);
}

// ─── helpers ────────────────────────────────────────────────────────────────

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 7 * DAY;

/** Assert result is within ±2 s of expected (covers rounding) */
function near(actual: number, expected: number, label = '') {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(2);
  if (label) return; // suppress TS unused-var warning
}

// ─── Guard: empty / invalid ──────────────────────────────────────────────────

describe('guard — empty / invalid', () => {
  it('returns nowSec for empty string', () => expect(exec('')).toBe(NOW_SEC));
  it('returns nowSec for null-ish coercion', () => {
    expect(pipe().exec(null as unknown as string)).toBe(NOW_SEC);
  });
  it('returns nowSec for unknown format (fallback to now)', () =>
    expect(exec('foobar xyz')).toBe(NOW_SEC));
});

// ─── Vague "now" ─────────────────────────────────────────────────────────────

describe('vague now', () => {
  const cases = [
    'just now',
    'Just Now',
    'a moment ago',
    'moments ago',
    'recently',
  ];
  it.each(cases)('"%s" → NOW_SEC', (v) => expect(exec(v)).toBe(NOW_SEC));
});

// ─── ms short codes ───────────────────────────────────────────────────────────

describe('ms short codes (English)', () => {
  it('27m', () => near(exec('27m'), NOW_SEC - 27 * MINUTE));
  it('2h', () => near(exec('2h'), NOW_SEC - 2 * HOUR));
  it('3d', () => near(exec('3d'), NOW_SEC - 3 * DAY));
  it('1w', () => near(exec('1w'), NOW_SEC - WEEK));
  it('1y', () =>
    near(exec('1y'), NOW_SEC - 31_557_600 /* ms("1y") / 1000 = 365.25d */));
});

// ─── ms natural English ───────────────────────────────────────────────────────

describe('ms natural English (no localeMap needed)', () => {
  it('2 hours', () => near(exec('2 hours'), NOW_SEC - 2 * HOUR));
  it('3 days', () => near(exec('3 days'), NOW_SEC - 3 * DAY));
  it('31 days', () => near(exec('31 days'), NOW_SEC - 31 * DAY));
  it('2 minutes', () => near(exec('2 minutes'), NOW_SEC - 2 * MINUTE));
});

// ─── "ago" stripping before ms ───────────────────────────────────────────────

describe('"ago" strip before ms retry', () => {
  it('2 hours ago', () => near(exec('2 hours ago'), NOW_SEC - 2 * HOUR));
  it('3 days ago', () => near(exec('3 days ago'), NOW_SEC - 3 * DAY));
  it('1 week ago', () => near(exec('1 week ago'), NOW_SEC - WEEK));
});

// ─── month expansion (daysPerMonth default = 30) ─────────────────────────────

describe('month expansion — default daysPerMonth=30', () => {
  it('1 month', () => near(exec('1 month'), NOW_SEC - 30 * DAY));
  it('2 months', () => near(exec('2 months'), NOW_SEC - 60 * DAY));
  it('3mo', () => near(exec('3mo'), NOW_SEC - 90 * DAY));
  it('1months', () => near(exec('1months'), NOW_SEC - 30 * DAY));
});

// ─── month expansion (custom daysPerMonth) ────────────────────────────────────

describe('month expansion — custom daysPerMonth', () => {
  it('1 month with daysPerMonth=28', () =>
    near(exec('1 month', { daysPerMonth: 28 }), NOW_SEC - 28 * DAY));
  it('2 months with daysPerMonth=31', () =>
    near(exec('2 months', { daysPerMonth: 31 }), NOW_SEC - 62 * DAY));
  it('3 bulan with daysPerMonth=28 + Indonesian localeMap', () => {
    const localeMap = { bulan: 'months', 'yang lalu': 'ago', lalu: 'ago' };
    near(
      exec('3 bulan lalu', { localeMap, daysPerMonth: 28 }),
      NOW_SEC - 84 * DAY,
    );
  });
});

// ─── Indonesian localeMap ────────────────────────────────────────────────────

describe('Indonesian localeMap', () => {
  const localeMap = {
    'yang lalu': 'ago',
    lalu: 'ago',
    jam: 'hours',
    menit: 'minutes',
    hari: 'days',
    minggu: 'weeks',
    bulan: 'months',
    tahun: 'years',
    'baru saja': 'just now',
  };

  it('27 menit lalu', () =>
    near(exec('27 menit lalu', { localeMap }), NOW_SEC - 27 * MINUTE));
  it('2 jam lalu', () =>
    near(exec('2 jam lalu', { localeMap }), NOW_SEC - 2 * HOUR));
  it('3 hari lalu', () =>
    near(exec('3 hari lalu', { localeMap }), NOW_SEC - 3 * DAY));
  it('1 minggu lalu', () =>
    near(exec('1 minggu lalu', { localeMap }), NOW_SEC - WEEK));
  it('2 bulan yang lalu', () =>
    near(exec('2 bulan yang lalu', { localeMap }), NOW_SEC - 60 * DAY));
  it('1 tahun lalu', () =>
    near(
      exec('1 tahun lalu', { localeMap }),
      NOW_SEC - 31_557_600 /* ms("1y") / 1000 = 365.25d */,
    ));
  it('baru saja', () => expect(exec('baru saja', { localeMap })).toBe(NOW_SEC));
  it('31 hari lalu (exact days, no approximation)', () =>
    near(exec('31 hari lalu', { localeMap }), NOW_SEC - 31 * DAY));
});

// ─── Japanese localeMap ──────────────────────────────────────────────────────

describe('Japanese localeMap', () => {
  const localeMap = {
    分前: 'minutes ago',
    時間前: 'hours ago',
    日前: 'days ago',
    ヶ月前: 'months ago',
    年前: 'years ago',
    たった今: 'just now',
  };

  it('27分前', () =>
    near(exec('27分前', { localeMap }), NOW_SEC - 27 * MINUTE));
  it('2時間前', () => near(exec('2時間前', { localeMap }), NOW_SEC - 2 * HOUR));
  it('3日前', () => near(exec('3日前', { localeMap }), NOW_SEC - 3 * DAY));
  it('2ヶ月前', () => near(exec('2ヶ月前', { localeMap }), NOW_SEC - 60 * DAY));
  it('1年前', () =>
    near(
      exec('1年前', { localeMap }),
      NOW_SEC - 31_557_600 /* ms("1y") / 1000 = 365.25d */,
    ));
  it('たった今', () => expect(exec('たった今', { localeMap })).toBe(NOW_SEC));
});

// ─── chrono-node fallback (absolute / natural language) ──────────────────────

describe('chrono-node fallback', () => {
  it('absolute ISO date', () => {
    const result = exec('2024-01-15');
    // just verify it's a plausible past timestamp
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(NOW_SEC);
  });

  it('absolute human date', () => {
    const result = exec('June 15 2024');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(NOW_SEC);
  });

  it('yesterday (chrono, sanity: returns non-zero past timestamp)', () => {
    // chrono uses system clock internally, not our Date.now() mock
    const result = exec('yesterday');
    const realNow = Math.floor(new Date().getTime() / 1000);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(realNow);
  });
});

// ─── format param ────────────────────────────────────────────────────────────

describe('format param', () => {
  it('parses absolute date matching format', () => {
    const result = exec('15 Jan 2024', { format: 'DD MMM YYYY' });
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(NOW_SEC);
  });

  it('falls through to ms when format does not match', () => {
    // "2h" won't parse as DD/MM/YYYY, should fall through to ms
    near(exec('2h', { format: 'DD/MM/YYYY' }), NOW_SEC - 2 * HOUR);
  });

  it('clamps future date to now', () => {
    // A date far in the future should be clamped to nowSec
    const result = exec('01 Jan 2099', { format: 'DD MMM YYYY' });
    expect(result).toBe(NOW_SEC);
  });
});

// ─── timezone param ───────────────────────────────────────────────────────────

describe('timezone param', () => {
  it('exec returns a valid timestamp regardless of timezone', () => {
    // Can't pin the exact value but it should be close to NOW_SEC (within 1 day)
    const result = exec('2h', { timezone: 'Asia/Jakarta' });
    near(result, NOW_SEC - 2 * HOUR);
  });

  it('reverse() uses format + timezone when both supplied', () => {
    const ts = 1_700_000_000;
    const result = pipe({
      format: 'DD MMM YYYY',
      timezone: 'Asia/Jakarta',
    }).reverse(ts);
    expect(typeof result).toBe('string');
    expect(result).not.toBe('');
    // Should be a formatted string, not ISO
    expect(result).not.toContain('T');
  });

  it('reverse() without format returns ISO string', () => {
    const ts = 1_700_000_000;
    const result = pipe({ timezone: 'Asia/Jakarta' }).reverse(ts);
    expect(result).toContain('T');
  });
});

// ─── reverse() ───────────────────────────────────────────────────────────────

describe('reverse()', () => {
  it('converts timestamp back to ISO string (no format)', () => {
    const ts = 1_700_000_000;
    const result = pipe().reverse(ts);
    expect(result).toContain('T');
  });

  it('converts timestamp back to formatted string when format supplied', () => {
    const ts = 1_700_000_000;
    const result = pipe({ format: 'DD MMM YYYY' }).reverse(ts);
    expect(result).toMatch(/^\d{2} \w{3} \d{4}$/);
  });
});

// ─── plainToClass hydration (as used by instantiatePipes) ────────────────────

describe('plainToClass hydration', () => {
  it('hydrates all params from plain object', () => {
    const instance = plainToClass(DateRelativePipe, {
      type: 'date-relative',
      localeMap: { menit: 'minutes', lalu: 'ago' },
      daysPerMonth: 28,
      timezone: 'Asia/Jakarta',
      format: 'DD MMM YYYY',
    });
    expect(instance.localeMap).toEqual({ menit: 'minutes', lalu: 'ago' });
    expect(instance.daysPerMonth).toBe(28);
    expect(instance.timezone).toBe('Asia/Jakarta');
    expect(instance.format).toBe('DD MMM YYYY');
    near(instance.exec('5 menit lalu'), NOW_SEC - 5 * MINUTE);
  });

  it('works with no params (English, daysPerMonth defaults to 30)', () => {
    const instance = plainToClass(DateRelativePipe, { type: 'date-relative' });
    expect(instance.localeMap).toBeUndefined();
    expect(instance.daysPerMonth).toBeUndefined();
    expect(instance.timezone).toBeUndefined();
    expect(instance.format).toBeUndefined();
    near(instance.exec('2h'), NOW_SEC - 2 * HOUR);
  });
});
