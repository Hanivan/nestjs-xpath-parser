import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PipeTransform } from '../types';
import { splitPath } from '../utils/url-path';

export class PathAppendPipe extends PipeTransform<string, string> {
  readonly type = 'path-append' as const;

  @IsString()
  @IsNotEmpty()
  pathSegment!: string;

  /** `after-base`: insert right after the origin; `after-path`: append to the path. */
  @IsIn(['after-base', 'after-path'])
  @IsOptional()
  appendMode: 'after-base' | 'after-path' = 'after-path';

  /** With `after-path`: insert right after this path fragment; end of path if absent. */
  @IsString()
  @IsOptional()
  afterPath?: string;

  exec(val: string): string {
    if (typeof val !== 'string') return val;
    // URL parser treats `\` as `/` and `%2e` as `.`, so split/check the same way.
    const segs = splitPath(this.pathSegment);
    if (segs.some((s) => /^(\.|%2e){1,2}$/i.test(s))) return val;
    try {
      const url = new URL(val);
      const parts = splitPath(url.pathname);
      let at = this.appendMode === 'after-base' ? 0 : parts.length;
      if (this.appendMode === 'after-path' && this.afterPath) {
        // Canonicalize like url.pathname so encoded/non-ASCII fragments match.
        const needle = splitPath(new URL(this.afterPath, 'http://x').pathname);
        const i = needle.length
          ? parts.findIndex((_, k) =>
              needle.every((n, j) => parts[k + j] === n),
            )
          : -1;
        if (i !== -1) at = i + needle.length;
      }
      const trailing = at < parts.length && url.pathname.endsWith('/');
      parts.splice(at, 0, ...segs);
      // Setter percent-encodes space, `?`, `#` etc. without double-encoding `%`.
      url.pathname = '/' + parts.join('/') + (trailing ? '/' : '');
      return url.toString();
    } catch {
      return val;
    }
  }

  reverse(val: string): string {
    return val;
  }
}
