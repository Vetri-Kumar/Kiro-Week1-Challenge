# Design Document

## Overview

The Time Zone Overlap Finder is a client-side web application that calculates and visualizes overlapping working hours between two cities. The system uses a time zone database to map cities to their respective time zones, performs UTC-based calculations to find overlapping periods, and presents results through an intuitive interface with visual timelines and meeting time suggestions.

The application prioritizes simplicity and speed by performing all calculations client-side, eliminating the need for backend API calls after the initial city/timezone data is loaded.

## Architecture

The application follows a modular, component-based architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ City Input   │  │   Timeline   │  │  Suggestions │  │
│  │  Component   │  │   Visualizer │  │   Display    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Business Logic Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Overlap    │  │  Time Zone   │  │   Meeting    │  │
│  │  Calculator  │  │   Converter  │  │  Suggester   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  City/TZ     │  │   Time Zone  │                     │
│  │  Database    │  │   Library    │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: React with TypeScript for type safety
- **Time Zone Library**: Luxon (modern, immutable, timezone-aware date/time library)
- **City/Timezone Data**: Embedded JSON dataset or integration with a lightweight API
- **Styling**: CSS modules or Tailwind CSS for responsive design
- **Build Tool**: Vite for fast development and optimized builds

## Components and Interfaces

### 1. City Input Component

**Responsibilities:**
- Render input fields for City A and City B
- Provide auto-complete suggestions as user types
- Validate city selections
- Emit selected city data to parent component

**Interface:**
```typescript
interface CityInputProps {
  label: string;
  onCitySelect: (city: City) => void;
  placeholder?: string;
}

interface City {
  name: string;
  country: string;
  timezone: string;
  coordinates?: { lat: number; lon: number };
}
```

### 2. Time Zone Converter

**Responsibilities:**
- Convert times between different time zones
- Handle daylight saving time transitions
- Provide current time for any timezone

**Interface:**
```typescript
interface TimeZoneConverter {
  getCurrentTime(timezone: string): DateTime;
  convertToUTC(time: DateTime, timezone: string): DateTime;
  convertFromUTC(time: DateTime, timezone: string): DateTime;
  getTimezoneOffset(timezone: string, date?: Date): number;
}
```

### 3. Overlap Calculator

**Responsibilities:**
- Calculate overlapping working hours between two time zones
- Handle edge cases (no overlap, same timezone, date boundaries)
- Convert overlap windows to local times

**Interface:**
```typescript
interface WorkingHours {
  start: number; // hour in 24h format (0-23)
  end: number;   // hour in 24h format (0-23)
}

interface OverlapResult {
  hasOverlap: boolean;
  overlapInUTC?: { start: DateTime; end: DateTime };
  overlapInCityA?: { start: DateTime; end: DateTime };
  overlapInCityB?: { start: DateTime; end: DateTime };
  durationMinutes?: number;
}

interface OverlapCalculator {
  calculateOverlap(
    cityA: City,
    cityB: City,
    workingHoursA: WorkingHours,
    workingHoursB: WorkingHours,
    date: Date
  ): OverlapResult;
}
```

### 4. Meeting Suggester

**Responsibilities:**
- Generate meeting time suggestions from overlap window
- Categorize suggestions by quality (Perfect/Acceptable/Not Recommended)
- Format suggestions for display

**Interface:**
```typescript
type MeetingQuality = 'Perfect Time' | 'Acceptable Time' | 'Not Recommended';

interface MeetingSuggestion {
  timeInCityA: DateTime;
  timeInCityB: DateTime;
  quality: MeetingQuality;
  durationMinutes: number;
}

interface MeetingSuggester {
  generateSuggestions(overlap: OverlapResult): MeetingSuggestion[];
  categorizeMeetingTime(
    time: DateTime,
    workingHours: WorkingHours,
    timezone: string
  ): MeetingQuality;
}
```

### 5. Timeline Visualizer Component

**Responsibilities:**
- Render visual representation of working hours
- Highlight overlapping periods
- Display time markers and labels

**Interface:**
```typescript
interface TimelineVisualizerProps {
  cityA: City;
  cityB: City;
  workingHoursA: WorkingHours;
  workingHoursB: WorkingHours;
  overlap: OverlapResult;
}
```

### 6. City/Timezone Database

**Responsibilities:**
- Provide searchable city data
- Map cities to IANA timezone identifiers
- Support fuzzy search for auto-complete

**Interface:**
```typescript
interface CityDatabase {
  searchCities(query: string, limit?: number): City[];
  getCityByName(name: string): City | null;
  getAllCities(): City[];
}
```

## Data Models

### City
```typescript
interface City {
  name: string;           // e.g., "London"
  country: string;        // e.g., "United Kingdom"
  timezone: string;       // IANA timezone, e.g., "Europe/London"
  coordinates?: {
    lat: number;
    lon: number;
  };
}
```

### Working Hours
```typescript
interface WorkingHours {
  start: number;  // 0-23 (hour in 24h format)
  end: number;    // 0-23 (hour in 24h format)
}
```

### Time Range
```typescript
interface TimeRange {
  start: DateTime;  // Luxon DateTime object
  end: DateTime;    // Luxon DateTime object
}
```

### Application State
```typescript
interface AppState {
  cityA: City | null;
  cityB: City | null;
  workingHoursA: WorkingHours;
  workingHoursB: WorkingHours;
  selectedDate: Date;
  customHoursEnabled: boolean;
  overlap: OverlapResult | null;
  suggestions: MeetingSuggestion[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: City search returns valid database entries
*For any* search query string, all auto-suggestion results returned by the system should be valid cities that exist in the Time Zone Database and match the search query.
**Validates: Requirements 1.2**

### Property 2: City selection populates input correctly
*For any* city selected from the auto-suggestions, the input field should be populated with that city's name.
**Validates: Requirements 1.3**

### Property 3: Invalid city names trigger errors
*For any* string that does not match a valid city in the database, attempting to use it for calculations should display an error message.
**Validates: Requirements 1.4**

### Property 4: Valid city pairs enable calculations
*For any* two valid cities from the database, the system should enable meeting time calculations.
**Validates: Requirements 1.5**

### Property 5: City selection retrieves correct timezone
*For any* valid city in the database, selecting that city should retrieve its associated IANA timezone identifier.
**Validates: Requirements 2.1**

### Property 6: Time zone conversion round-trip accuracy
*For any* city with a valid timezone, converting the current time to that timezone and then to UTC and back should preserve the original time (within the same minute).
**Validates: Requirements 2.2, 3.2, 3.5**

### Property 7: Default working hours are applied
*For any* two cities with valid timezones, when no custom hours are specified, the system should apply working hours of 9 AM to 6 PM for both cities.
**Validates: Requirements 3.1**

### Property 8: Overlap calculation correctness
*For any* two time ranges in UTC, the computed intersection should correctly identify the overlapping period, or correctly indicate no overlap exists.
**Validates: Requirements 3.3**

### Property 9: Meeting suggestions display both local times
*For any* calculated overlap window, all meeting time suggestions should display the time in both City A's and City B's local timezones.
**Validates: Requirements 4.1**

### Property 10: Meeting time format consistency
*For any* meeting suggestion, the formatted output string should match the pattern "HH:MM AM/PM CityA ↔ HH:MM AM/PM CityB".
**Validates: Requirements 4.2**

### Property 11: Largest overlap is identified
*For any* set of possible meeting time slots, the system should correctly identify and highlight the slot with the longest duration.
**Validates: Requirements 4.3**

### Property 12: Current times are displayed
*For any* two cities, the system should display the current local time for both cities based on their respective timezones.
**Validates: Requirements 4.4**

### Property 13: Limited overlap indication
*For any* overlap window with duration less than 60 minutes, the system should indicate that the overlap is limited.
**Validates: Requirements 4.5**

### Property 14: Visual timeline completeness
*For any* two cities with calculated overlap, the visual representation should include distinct visual elements for City A working hours, City B working hours, and the overlapping period (if it exists).
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 15: Working hours validation
*For any* pair of start and end times, the system should validate that the end time is after the start time, and reject invalid combinations.
**Validates: Requirements 6.2**

### Property 16: Recalculation with input changes
*For any* change to working hours or selected date, the system should recalculate the overlap window and meeting suggestions using the new inputs.
**Validates: Requirements 6.3, 7.2**

### Property 17: Invalid hours prevent calculation
*For any* invalid working hours configuration (e.g., end before start), the system should display an error and prevent overlap calculation.
**Validates: Requirements 6.4**

### Property 18: Clipboard copy functionality
*For any* meeting suggestion, clicking the copy button should copy the formatted meeting time string to the system clipboard.
**Validates: Requirements 8.2**

### Property 19: Meeting quality categorization completeness
*For any* meeting time suggestion, the system should assign exactly one quality category: "Perfect Time", "Acceptable Time", or "Not Recommended".
**Validates: Requirements 9.1**

### Property 20: Perfect time categorization accuracy
*For any* meeting time that falls in the middle third of both cities' working hours, the system should categorize it as "Perfect Time".
**Validates: Requirements 9.2**

### Property 21: Acceptable time categorization accuracy
*For any* meeting time that falls in the first or last third of working hours for one city but within working hours for both, the system should categorize it as "Acceptable Time".
**Validates: Requirements 9.3**

### Property 22: Not recommended categorization accuracy
*For any* meeting time that falls outside the working hours of either city, the system should categorize it as "Not Recommended".
**Validates: Requirements 9.4**

## Error Handling

### Input Validation Errors
- **Invalid City Name**: Display user-friendly message "City not found. Please select from suggestions."
- **Empty Input**: Disable calculation button and show hint "Please select both cities"
- **Invalid Working Hours**: Show message "End time must be after start time"

### Time Zone Errors
- **Missing Timezone Data**: Display "Unable to determine timezone for [city]. Please try another city."
- **Timezone Conversion Failure**: Log error and show "An error occurred. Please refresh and try again."

### Calculation Errors
- **No Overlap Found**: Display informative message "No overlapping working hours found. Consider adjusting working hours or choosing different cities."
- **Date Calculation Error**: Show "Unable to calculate for selected date. Please try another date."

### System Errors
- **Clipboard Access Denied**: Show "Unable to copy to clipboard. Please copy manually."
- **Data Loading Failure**: Display "Unable to load city data. Please refresh the page."

### Error Handling Principles
1. All errors should be user-friendly and actionable
2. Technical errors should be logged for debugging but not shown to users
3. The application should gracefully degrade (e.g., disable features rather than crash)
4. Validation errors should be shown inline near the relevant input
5. System errors should provide a recovery action (refresh, retry)

## Testing Strategy

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage and correctness.

### Unit Testing Approach

Unit tests will verify specific examples, edge cases, and integration points:

**Key Unit Test Areas:**
- **Component Rendering**: Verify that UI components render correctly with expected props
- **Edge Cases**: Test boundary conditions like:
  - Cities in the same timezone
  - No overlap between working hours
  - Overlap less than 1 hour
  - Working hours spanning midnight
  - DST transition dates
- **Error Conditions**: Verify error handling for:
  - Invalid city names
  - Missing timezone data
  - Invalid working hours (end before start)
  - Clipboard access failures
- **Integration Points**: Test interactions between components:
  - City selection triggering timezone lookup
  - Overlap calculation triggering suggestion generation
  - Date change triggering recalculation

**Unit Test Framework**: Jest with React Testing Library for component tests

### Property-Based Testing Approach

Property-based tests will verify universal properties across many randomly generated inputs:

**Property Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Tagging**: Each property-based test MUST include a comment tag in this exact format:
```typescript
// Feature: timezone-overlap-finder, Property {number}: {property description}
```

**Key Property Test Areas:**
- **Time Conversion Accuracy**: Generate random timezones and times, verify conversions are correct
- **Overlap Calculation**: Generate random working hours and timezones, verify overlap logic
- **Format Consistency**: Generate random meeting times, verify output format matches specification
- **Categorization Logic**: Generate random meeting times and working hours, verify quality categories are assigned correctly
- **Validation Rules**: Generate random input combinations, verify validation behaves correctly

**Generator Strategies:**
- **Timezone Generator**: Select from valid IANA timezone identifiers
- **Time Generator**: Generate times within 24-hour range (0-23 hours, 0-59 minutes)
- **City Generator**: Select from the city database
- **Working Hours Generator**: Generate valid working hour ranges (start < end, both 0-23)
- **Date Generator**: Generate dates within a reasonable range, including DST transition dates

**Property Test Implementation Requirements:**
- Each correctness property from the design document MUST be implemented by a SINGLE property-based test
- Each test MUST be tagged with the property number and description
- Tests should use smart generators that constrain inputs to valid ranges
- Tests should avoid mocking when possible to test real functionality

### Test Organization

```
src/
  components/
    CityInput.tsx
    CityInput.test.tsx          # Unit tests
  utils/
    timeZoneConverter.ts
    timeZoneConverter.test.ts   # Unit tests
    timeZoneConverter.property.test.ts  # Property tests
  calculators/
    overlapCalculator.ts
    overlapCalculator.test.ts   # Unit tests
    overlapCalculator.property.test.ts  # Property tests
```

### Testing Principles

1. **Implementation-First Development**: Implement features before writing corresponding tests
2. **Complementary Coverage**: Unit tests catch specific bugs, property tests verify general correctness
3. **Fast Feedback**: Unit tests should run quickly; property tests may take longer but provide deeper validation
4. **Realistic Testing**: Avoid mocking when possible; test real functionality with real data
5. **Clear Failures**: Test failures should clearly indicate what property was violated

## Implementation Notes

### Time Zone Handling
- Use Luxon's `DateTime` objects for all time manipulations
- Always convert to UTC for calculations, then convert back to local times for display
- Handle DST transitions by using Luxon's built-in DST awareness
- Store timezone as IANA identifier (e.g., "America/New_York", "Europe/London")

### Overlap Calculation Algorithm
1. Convert both cities' working hours to UTC for the selected date
2. Find the intersection of the two UTC time ranges
3. If intersection exists, convert back to both local times
4. Calculate duration in minutes
5. Generate meeting suggestions at regular intervals (e.g., every 30 minutes) within the overlap

### Meeting Quality Categorization Logic
- **Perfect Time**: Meeting time falls in the middle third (hours 3-6 of a 9-hour workday) for BOTH cities
- **Acceptable Time**: Meeting time is within working hours for both but in the first/last third for at least one city
- **Not Recommended**: Meeting time falls outside working hours for either city

### Performance Considerations
- City database should be loaded once and cached in memory
- Calculations should be performed client-side to avoid network latency
- Debounce city search input to avoid excessive filtering
- Memoize expensive calculations (overlap, suggestions) to avoid recalculation on re-renders

### Accessibility
- All interactive elements should be keyboard accessible
- Provide ARIA labels for screen readers
- Ensure sufficient color contrast for visual elements
- Support keyboard navigation through suggestions
- Provide text alternatives for visual timeline

### Browser Compatibility
- Target modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- Use Luxon for consistent timezone handling across browsers
- Test clipboard API with fallback for unsupported browsers
- Ensure responsive design works on mobile devices
