import { plainToClass } from 'class-transformer';
// Registry first: loading the pipe first hits the types<->registry import cycle.
import { PIPE_REGISTRY } from '../types';
import { PathAppendPipe } from './PathAppendPipe';

function exec(value: string, params: Partial<PathAppendPipe>): string {
  return plainToClass(PathAppendPipe, { type: 'path-append', ...params }).exec(
    value,
  );
}

describe('PathAppendPipe', () => {
  it('is registered as path-append', () => {
    expect(PIPE_REGISTRY['path-append']).toBe(PathAppendPipe);
  });

  it('defaults to after-path and appends to the end', () => {
    expect(exec('https://x.com/t/123/', { pathSegment: 'page-2' })).toBe(
      'https://x.com/t/123/page-2',
    );
  });

  it('keeps query and hash', () => {
    expect(exec('https://x.com/t/1?a=1#h', { pathSegment: '/amp' })).toBe(
      'https://x.com/t/1/amp?a=1#h',
    );
  });

  it('inserts after a matching afterPath', () => {
    expect(
      exec('https://x.com/forum/t/9', {
        pathSegment: 'm',
        afterPath: '/forum',
      }),
    ).toBe('https://x.com/forum/m/t/9');
  });

  it('falls back to the end when afterPath is absent', () => {
    expect(
      exec('https://x.com/t/9', { pathSegment: 'm', afterPath: '/nope' }),
    ).toBe('https://x.com/t/9/m');
  });

  it('after-base inserts right after the origin', () => {
    expect(
      exec('https://x.com/t/9', {
        pathSegment: 'en',
        appendMode: 'after-base',
      }),
    ).toBe('https://x.com/en/t/9');
    expect(
      exec('https://x.com/', { pathSegment: 'en', appendMode: 'after-base' }),
    ).toBe('https://x.com/en');
  });

  it('matches afterPath on whole segments only', () => {
    expect(
      exec('https://x.com/apiv2/x', { pathSegment: 'v1', afterPath: '/api' }),
    ).toBe('https://x.com/apiv2/x/v1');
    expect(
      exec('https://x.com/api/x', { pathSegment: 'v1', afterPath: '/api/' }),
    ).toBe('https://x.com/api/v1/x');
  });

  it('matches non-ASCII afterPath against the encoded path', () => {
    expect(
      exec('https://x.com/café/x', { pathSegment: 'm', afterPath: 'café' }),
    ).toBe('https://x.com/caf%C3%A9/m/x');
  });

  it('never emits double slashes', () => {
    expect(
      exec('https://x.com/a', { pathSegment: 'v1/', appendMode: 'after-base' }),
    ).toBe('https://x.com/v1/a');
    expect(
      exec('https://x.com/f/t', { pathSegment: '/m/', afterPath: '/f' }),
    ).toBe('https://x.com/f/m/t');
  });

  it('rejects dot segments in pathSegment', () => {
    expect(exec('https://x.com/a/b', { pathSegment: '../..' })).toBe(
      'https://x.com/a/b',
    );
    expect(exec('https://x.com/a', { pathSegment: 'x/../../admin' })).toBe(
      'https://x.com/a',
    );
    expect(exec('https://x.com/a', { pathSegment: '%2E%2e/admin' })).toBe(
      'https://x.com/a',
    );
    expect(exec('https://x.com/a', { pathSegment: 'x\\..\\..' })).toBe(
      'https://x.com/a',
    );
  });

  it('keeps trailing slash when inserting mid-path', () => {
    expect(
      exec('https://x.com/f/t/', { pathSegment: 'm', afterPath: 'f' }),
    ).toBe('https://x.com/f/m/t/');
  });

  it('encodes path-breaking characters in pathSegment', () => {
    expect(exec('https://x.com/a', { pathSegment: 'a b?c#d' })).toBe(
      'https://x.com/a/a%20b%3Fc%23d',
    );
  });

  it('returns invalid URLs and non-strings unchanged', () => {
    expect(exec('/relative/path', { pathSegment: 'x' })).toBe('/relative/path');
    expect(exec(undefined as unknown as string, { pathSegment: 'x' })).toBe(
      undefined,
    );
  });
});
