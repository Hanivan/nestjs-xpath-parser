import * as chrono from 'chrono-node';
import { default as msLib } from 'ms';
import moment from 'moment-timezone';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { PipeTransform } from '../types';

const VAGUE_NOW = /^(just now|moments? ago|a moment ago|recently)$/i;

// ms doesn't support months — expand before passing
const MS_MONTHS = /^(\d+)\s*mo(?:nths?)?$/i;
const MS_MONTH_DAYS_DEFAULT = 30;

function expandMonths(v: string, daysPerMonth: number): number | null {
  const m = MS_MONTHS.exec(v);
  return m ? parseInt(m[1], 10) * daysPerMonth * 24 * 60 * 60 * 1000 : null;
}

function msMs(v: string): number | undefined {
  return (msLib as (v: string) => number | undefined)(v);
}

function applyLocaleMap(v: string, map: Record<string, string>): string {
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const k of keys) v = v.replace(new RegExp(k, 'gi'), map[k]);
  return v;
}

function nowMoment(timezone?: string): moment.Moment {
  return timezone ? moment.tz(timezone) : moment();
}

function toTimestamp(
  value: string,
  localeMap?: Record<string, string>,
  daysPerMonth = MS_MONTH_DAYS_DEFAULT,
  timezone?: string,
  format?: string,
): number {
  const v = value.trim();
  const now = nowMoment(timezone);
  const nowSec = now.unix();

  if (VAGUE_NOW.test(v)) return nowSec;

  // 1. Absolute format match — if format supplied try moment(v, format) first
  if (format) {
    const m = timezone
      ? moment.tz(v, format, timezone)
      : moment(v, format, true);
    if (m.isValid() && m.unix() <= nowSec) return m.unix();
  }

  // 2. ms — "27m", "2h", "3d", "1w", "1y", "2 hours", "3 days"
  const months = expandMonths(v, daysPerMonth);
  if (months !== null) return nowSec - Math.floor(months / 1000);
  const msVal = msMs(v);
  if (typeof msVal === 'number') return nowSec - Math.floor(msVal / 1000);

  // 3. Apply consumer-supplied locale map, retry ms
  let normalized = v;
  if (localeMap) normalized = applyLocaleMap(normalized, localeMap);

  const stripped = normalized.replace(/\bago\b/i, '').trim();
  const months2 = expandMonths(stripped, daysPerMonth);
  if (months2 !== null) return nowSec - Math.floor(months2 / 1000);
  const msVal2 = msMs(stripped);
  if (typeof msVal2 === 'number') return nowSec - Math.floor(msVal2 / 1000);

  // 4. chrono-node — natural language + absolute dates
  if (VAGUE_NOW.test(normalized)) return nowSec;
  const refDate = timezone ? now.toDate() : new Date();
  const parsed = chrono.parseDate(normalized, refDate);
  if (parsed) {
    const ts = Math.floor(parsed.getTime() / 1000);
    // clamp future dates to now (same as v1 behavior)
    return ts > nowSec ? nowSec : ts;
  }

  // fallback to now (v1 behavior)
  return nowSec;
}

/**
 * Converts relative or natural-language date strings to Unix timestamps (seconds).
 *
 * Pipeline:
 *   1. `format`    — if supplied, try moment(v, format) for absolute date strings
 *   2. `ms`        — short/medium English codes: "27m", "2h", "3d", "2 hours", "3 days"
 *   3. localeMap   — consumer-supplied translation map applied, then retried through ms
 *   4. chrono-node — natural language + absolute dates: "yesterday", "Jun 29 2026", "2024-01-15"
 *   5. fallback    — returns now (not 0) when nothing matches
 *
 * @example
 * // English only:
 * { type: 'date-relative' }
 *
 * // With explicit format + timezone:
 * { type: 'date-relative', format: 'DD MMM YYYY', timezone: 'Asia/Jakarta' }
 *
 * // Indonesian forum:
 * { type: 'date-relative', timezone: 'Asia/Jakarta', localeMap: { 'yang lalu': 'ago', lalu: 'ago', jam: 'hours', menit: 'minutes', hari: 'days', minggu: 'weeks', bulan: 'months', tahun: 'years', 'baru saja': 'just now' } }
 *
 * // Japanese forum:
 * { type: 'date-relative', timezone: 'Asia/Tokyo', localeMap: { '分前': 'minutes ago', '時間前': 'hours ago', '日前': 'days ago', 'ヶ月前': 'months ago', '年前': 'years ago', 'たった今': 'just now' } }
 */
export class DateRelativePipe extends PipeTransform<string, number> {
  readonly type = 'date-relative' as const;

  @IsOptional()
  @IsObject()
  localeMap?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  daysPerMonth?: number;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  format?: string;

  exec(value: string): number {
    if (!value || typeof value !== 'string')
      return nowMoment(this.timezone).unix();
    return toTimestamp(
      value,
      this.localeMap,
      this.daysPerMonth ?? MS_MONTH_DAYS_DEFAULT,
      this.timezone,
      this.format,
    );
  }

  reverse(timestamp: number): string {
    const m = this.timezone
      ? moment.tz(timestamp * 1000, this.timezone)
      : moment(timestamp * 1000);
    return this.format ? m.format(this.format) : m.toISOString();
  }
}
