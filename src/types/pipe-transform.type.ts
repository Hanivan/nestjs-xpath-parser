/**
 * Abstract base class for custom pipe transformations.
 * Extend this class to create custom pipe logic.
 *
 * @example
 * ```typescript
 * class DateFormatPipe extends PipeTransform<string, number> {
 *   constructor(private format: string = 'YYYY-MM-DD') {
 *     super();
 *   }
 *
 *   exec(value: string): number {
 *     return moment(value, this.format).unix();
 *   }
 * }
 * ```
 */
export abstract class PipeTransform<TInput = string, TOutput = unknown> {
  /**
   * Execute the pipe transformation.
   * @param value - The input value to transform
   * @returns The transformed value
   */
  abstract exec(value: TInput): TOutput;

  /**
   * Optional reverse transformation.
   * Override this if you want to support bidirectional transformation.
   * @param value - The value to reverse transform
   * @returns The original value
   */
  reverse(value: TOutput): TInput {
    return value as unknown as TInput;
  }
}

/**
 * Type for custom pipe instance
 */
export type CustomPipe = PipeTransform;

/**
 * Map of custom pipe names to pipe instances
 */
export type CustomPipeMap = Record<string, CustomPipe>;
