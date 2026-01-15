# TODO / Development Guidelines

## General Guidelines

### Code Style

- **Do not use `eslint-disable-next-line` if possible**
  - If you must use it, add a comment explaining why
  - Prefer fixing the underlying issue or using proper type definitions
  - Example of acceptable use with explanation:
    ```typescript
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // Accessing libxmljs internal property that has no type definition
    this.originalErrorHandler = (libxmljs as any).errorCatchingHandler;
    ```

## Future Improvements

### Type Safety

- [x] Replace `eslint-disable` comments with proper type definitions for libxmljs
- [x] Create type definitions for libxmljs internal properties (see src/types/libxmljs.d.ts)

### Testing

- [ ] Remove JSDOM mocking in tests to enable full JSDOM engine testing
- [ ] Add more integration tests with real HTTP requests

### Documentation

- [ ] Add more real-world examples
- [ ] Add video tutorials for complex features
