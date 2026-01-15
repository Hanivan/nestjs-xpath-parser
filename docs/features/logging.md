# Logging Configuration

Control which log messages are displayed by the scraper service.

## Overview

The scraper uses NestJS's built-in logging system with configurable log levels. You can control the verbosity of logs to suit your needs:

- Filter out unnecessary log messages in production
- Focus only on errors and warnings
- Enable debug logging for troubleshooting
- Errors are **always logged** regardless of configuration

## Available Log Levels

NestJS supports the following log levels:

- `'log'` - General log messages
- `'error'` - Error messages (**always logged**)
- `'warn'` - Warning messages
- `'debug'` - Debug messages
- `'verbose'` - Verbose messages
- `'fatal'` - Fatal error messages

**Important:** Error messages are **always logged**, regardless of configuration. This ensures critical errors are never missed.

## Configuring Log Level

### Using forRoot()

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      logLevel: ['error', 'warn'], // Only log errors and warnings
    }),
  ],
})
export class AppModule {}
```

### Using forRootAsync()

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScraperHtmlModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        logLevel: configService.get<string[]>('SCRAPER_LOG_LEVEL', [
          'log',
          'error',
          'warn',
        ]),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Environment Variable

```env
# .env
SCRAPER_LOG_LEVEL=["error","warn"]
```

## Configuration Examples

### Minimal Logging (Errors Only)

Since errors are always logged, an empty array provides minimal logging:

```typescript
ScraperHtmlModule.forRoot({
  logLevel: [], // Only errors (errors are always logged)
});
```

### Errors and Warnings

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['warn'], // errors are always included
});
```

### Standard Logging (Default)

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['log', 'error', 'warn'], // Default configuration
});
```

### Debug Mode (Noisy)

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['log', 'error', 'warn', 'debug', 'verbose'],
});
```

### Single Log Level

You can also pass a single log level as a string:

```typescript
ScraperHtmlModule.forRoot({
  logLevel: 'warn', // Only warnings (and errors, which are always logged)
});
```

## When to Use Each Level

### Production Environment

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['error', 'warn'], // Minimal logging
});
```

### Development Environment

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['log', 'error', 'warn', 'debug'], // Detailed logging
});
```

### Troubleshooting

```typescript
ScraperHtmlModule.forRoot({
  logLevel: ['log', 'error', 'warn', 'debug', 'verbose'], // Everything
});
```

## Complete Example

```typescript
import { Module } from '@nestjs/common';
import { ScraperHtmlModule } from '@hanivanrizky/nestjs-xpath-parser';

@Module({
  imports: [
    ScraperHtmlModule.forRoot({
      // Retry configuration
      maxRetries: 5,

      // Logging configuration
      logLevel: ['error', 'warn'],

      // Error suppression
      suppressXpathErrors: true,

      // Engine selection
      engine: 'libxmljs',
    }),
  ],
})
export class AppModule {}
```

## Configuration Summary

| Option     | Type                   | Default                    | Description          |
| ---------- | ---------------------- | -------------------------- | -------------------- |
| `logLevel` | LogLevel \| LogLevel[] | `['log', 'error', 'warn']` | Log levels to enable |

**Note:** Errors are always logged regardless of `logLevel` configuration.

## Related Features

- [HTTP Retry & Proxy](./retry-proxy.md) - Retry configuration and proxy setup
- [Engine Selection](./engine-selection.md) - Choose between libxmljs and JSDOM
