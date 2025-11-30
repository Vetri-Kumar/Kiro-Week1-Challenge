# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize React + TypeScript project with Vite
  - Install Luxon for timezone handling
  - Install fast-check for property-based testing
  - Install Jest and React Testing Library for unit testing
  - Set up basic project structure (components, utils, calculators folders)
  - _Requirements: All_

- [x] 2. Create city/timezone database and search functionality
  - Create JSON dataset with cities, countries, and IANA timezone identifiers
  - Implement CityDatabase class with search and lookup methods
  - Implement fuzzy search algorithm for city auto-complete
  - _Requirements: 1.2, 1.4, 2.1_

- [x] 2.1 Write property test for city search
  - **Property 1: City search returns valid database entries**
  - **Validates: Requirements 1.2**

- [x] 2.2 Write unit tests for city database
  - Test exact city name lookup
  - Test empty search query handling
  - Test search with special characters
  - _Requirements: 1.2, 1.4_

- [x] 3. Implement time zone conversion utilities
  - Create TimeZoneConverter class using Luxon
  - Implement getCurrentTime method for any timezone
  - Implement convertToUTC and convertFromUTC methods
  - Implement getTimezoneOffset method
  - Handle DST transitions correctly
  - _Requirements: 2.2, 3.2, 3.5_

- [x] 3.1 Write property test for timezone conversion round-trip
  - **Property 6: Time zone conversion round-trip accuracy**
  - **Validates: Requirements 2.2, 3.2, 3.5**

- [x] 3.2 Write unit tests for timezone converter
  - Test conversion for specific known timezones
  - Test DST transition dates
  - Test edge cases (UTC, timezones with 30/45 minute offsets)
  - _Requirements: 2.2, 3.2_

- [x] 4. Implement overlap calculation logic
  - Create OverlapCalculator class
  - Implement calculateOverlap method that converts working hours to UTC
  - Implement time range intersection logic
  - Handle edge cases (no overlap, same timezone, midnight spanning)
  - Convert overlap results back to local times
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Write property test for overlap calculation
  - **Property 8: Overlap calculation correctness**
  - **Validates: Requirements 3.3**

- [x] 4.2 Write property test for default working hours
  - **Property 7: Default working hours are applied**
  - **Validates: Requirements 3.1**

- [x] 4.3 Write unit tests for overlap calculator
  - Test no overlap scenario
  - Test same timezone scenario
  - Test working hours spanning midnight
  - Test partial overlap scenarios
  - _Requirements: 3.3, 3.4_

- [x] 5. Implement meeting suggestion generator
  - Create MeetingSuggester class
  - Implement generateSuggestions method to create time slots from overlap
  - Implement categorizeMeetingTime method for quality categorization
  - Calculate meeting quality based on position within working hours
  - Format suggestions with both cities' local times
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.2, 9.3, 9.4_

- [x] 5.1 Write property test for meeting time format
  - **Property 10: Meeting time format consistency**
  - **Validates: Requirements 4.2**

- [x] 5.2 Write property test for quality categorization completeness
  - **Property 19: Meeting quality categorization completeness**
  - **Validates: Requirements 9.1**

- [x] 5.3 Write property test for perfect time categorization
  - **Property 20: Perfect time categorization accuracy**
  - **Validates: Requirements 9.2**

- [x] 5.4 Write property test for acceptable time categorization
  - **Property 21: Acceptable time categorization accuracy**
  - **Validates: Requirements 9.3**

- [x] 5.5 Write property test for not recommended categorization
  - **Property 22: Not recommended categorization accuracy**
  - **Validates: Requirements 9.4**

- [x] 5.6 Write property test for largest overlap identification
  - **Property 11: Largest overlap is identified**
  - **Validates: Requirements 4.3**

- [x] 5.7 Write unit tests for meeting suggester
  - Test suggestion generation with various overlap durations
  - Test edge case: overlap less than 1 hour
  - Test categorization boundary conditions
  - _Requirements: 4.1, 4.5, 9.1_

- [x] 6. Create CityInput component
  - Build input field with auto-complete functionality
  - Implement debounced search as user types
  - Display suggestion dropdown with city and country
  - Handle city selection and emit to parent
  - Display error messages for invalid cities
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6.1 Write property test for city selection
  - **Property 2: City selection populates input correctly**
  - **Validates: Requirements 1.3**

- [x] 6.2 Write property test for invalid city errors
  - **Property 3: Invalid city names trigger errors**
  - **Validates: Requirements 1.4**

- [x] 6.3 Write unit tests for CityInput component
  - Test component renders with correct label
  - Test dropdown appears on typing
  - Test selection clears dropdown
  - Test keyboard navigation through suggestions
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Create WorkingHoursInput component
  - Build time picker inputs for start and end times
  - Implement validation (end time after start time)
  - Display validation errors inline
  - Emit working hours changes to parent
  - Support enabling/disabling custom hours
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 7.1 Write property test for working hours validation
  - **Property 15: Working hours validation**
  - **Validates: Requirements 6.2**

- [x] 7.2 Write property test for invalid hours error handling
  - **Property 17: Invalid hours prevent calculation**
  - **Validates: Requirements 6.4**

- [x] 7.3 Write unit tests for WorkingHoursInput component
  - Test default hours display (9 AM - 6 PM)
  - Test validation error display
  - Test custom hours toggle
  - _Requirements: 6.1, 6.2_

- [x] 8. Create TimelineVisualizer component
  - Build visual timeline showing 24-hour period
  - Render working hours blocks for both cities
  - Highlight overlapping period with distinct styling
  - Display time markers and labels
  - Handle no-overlap case with gap indication
  - Make responsive for mobile devices
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 8.1 Write property test for timeline completeness
  - **Property 14: Visual timeline completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 8.2 Write unit tests for TimelineVisualizer component
  - Test rendering with overlap
  - Test rendering without overlap
  - Test same timezone display
  - _Requirements: 5.1, 5.4_

- [x] 9. Create MeetingSuggestions component
  - Display list of meeting time suggestions
  - Show formatted time for both cities
  - Display quality indicator (Perfect/Acceptable/Not Recommended)
  - Highlight largest overlap period
  - Show current local time for both cities
  - Display limited overlap warning when duration < 1 hour
  - Implement copy-to-clipboard button for each suggestion
  - Show copy success/failure feedback
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4_

- [x] 9.1 Write property test for meeting suggestions display
  - **Property 9: Meeting suggestions display both local times**
  - **Validates: Requirements 4.1**

- [x] 9.2 Write property test for current time display
  - **Property 12: Current times are displayed**
  - **Validates: Requirements 4.4**

- [x] 9.3 Write property test for limited overlap indication
  - **Property 13: Limited overlap indication**
  - **Validates: Requirements 4.5**

- [x] 9.4 Write property test for clipboard functionality
  - **Property 18: Clipboard copy functionality**
  - **Validates: Requirements 8.2**

- [x] 9.5 Write unit tests for MeetingSuggestions component
  - Test rendering with multiple suggestions
  - Test rendering with no suggestions
  - Test copy button click handling
  - Test success/error message display
  - _Requirements: 4.1, 8.1, 8.3, 8.4_

- [x] 10. Create DateSelector component
  - Build date selection UI (today/tomorrow options)
  - Emit date changes to parent component
  - Display selected date clearly
  - _Requirements: 7.1, 7.2_

- [x] 10.1 Write unit tests for DateSelector component
  - Test today selection
  - Test tomorrow selection
  - Test date display format
  - _Requirements: 7.1_

- [x] 11. Build main App component and state management
  - Create AppState interface and initialize state
  - Implement city selection handlers
  - Implement working hours change handlers
  - Implement date selection handlers
  - Trigger overlap calculation when inputs change
  - Trigger suggestion generation from overlap results
  - Handle loading and error states
  - Wire up all child components
  - _Requirements: 1.5, 2.3, 6.3, 7.2_

- [x] 11.1 Write property test for valid city pairs enabling calculations
  - **Property 4: Valid city pairs enable calculations**
  - **Validates: Requirements 1.5**

- [x] 11.2 Write property test for city timezone retrieval
  - **Property 5: City selection retrieves correct timezone**
  - **Validates: Requirements 2.1**

- [x] 11.3 Write property test for recalculation on input changes
  - **Property 16: Recalculation with input changes**
  - **Validates: Requirements 6.3, 7.2**

- [x] 11.4 Write integration tests for App component
  - Test full user flow: select cities → see suggestions
  - Test custom working hours flow
  - Test date change flow
  - Test error handling flow
  - _Requirements: 1.5, 6.3, 7.2_

- [x] 12. Add styling and responsive design
  - Create CSS modules or Tailwind configuration
  - Style all components with clean, modern design
  - Ensure responsive layout for mobile devices
  - Add loading spinners and transitions
  - Implement color scheme for quality indicators
  - Ensure accessibility (color contrast, focus states)
  - _Requirements: All UI requirements_

- [x] 13. Implement accessibility features
  - Add ARIA labels to all interactive elements
  - Ensure keyboard navigation works throughout
  - Add screen reader support for timeline visualization
  - Test with keyboard-only navigation
  - Verify color contrast meets WCAG standards
  - _Requirements: All UI requirements_

- [x] 14. Add error handling and edge cases
  - Implement error boundaries for React components
  - Add graceful degradation for missing data
  - Handle timezone detection failures
  - Handle clipboard API unavailability
  - Add user-friendly error messages throughout
  - _Requirements: 1.4, 2.3, 6.4, 8.4_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Create sample city database
  - Populate database with major world cities
  - Include cities from all major timezones
  - Include cities with DST and without DST
  - Verify all timezone identifiers are valid IANA identifiers
  - _Requirements: 1.2, 2.1_

- [x] 17. Final integration and polish
  - Test complete user flows end-to-end
  - Verify all features work together correctly
  - Optimize performance (memoization, debouncing)
  - Add loading states where appropriate
  - Final accessibility review
  - _Requirements: All_

- [x] 18. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
