import { IsNotEmpty, IsString } from 'class-validator';
import { JSONPath } from 'jsonpath-plus';
import { PipeTransform } from '../types';

export class JsonPathPipe extends PipeTransform<string, string> {
  readonly type = 'json-path' as const;

  @IsString()
  @IsNotEmpty()
  path!: string;

  baseUrl?: string;

  exec(val: string): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json = typeof val === 'string' ? JSON.parse(val) : val;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result: unknown = JSONPath({ path: this.path, json });
      return String(result);
    } catch {
      return val;
    }
  }

  reverse(val: string): string {
    return val;
  }
}
