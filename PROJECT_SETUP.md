# Time Zone Overlap Finder - Project Setup

## Project Structure

```
src/
├── components/       # React UI components
├── utils/           # Utility functions and classes
├── calculators/     # Business logic calculators
├── test/            # Test setup and utilities
├── types/           # TypeScript type definitions
└── assets/          # Static assets
```

## Installed Dependencies

### Core Dependencies
- **React 19.2.0** - UI framework
- **Luxon 3.7.2** - Timezone handling library

### Development Dependencies
- **Vite 7.2.4** - Build tool and dev server
- **TypeScript 5.9.3** - Type safety
- **Vitest 4.0.14** - Unit testing framework
- **fast-check 4.3.0** - Property-based testing library
- **@testing-library/react 16.3.0** - React component testing utilities
- **@testing-library/jest-dom 6.9.1** - DOM matchers for testing
- **jsdom 27.2.0** - DOM implementation for testing

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint

## Testing Configuration

- Test framework: Vitest with jsdom environment
- Test setup file: `src/test/setup.ts`
- Property-based testing: fast-check (configured for 100+ iterations per property)
- Component testing: React Testing Library

## Next Steps

The project is ready for implementation. Follow the tasks in `.kiro/specs/timezone-overlap-finder/tasks.md` to build the application.
