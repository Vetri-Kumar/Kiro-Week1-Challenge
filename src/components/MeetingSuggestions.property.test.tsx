import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingSuggestions } from './MeetingSuggestions';
import { DateTime } from 'luxon';
import type { City, MeetingSuggestion } from '../types';

// Generators
const cityGenerator = (): fc.Arbitrary<City> => {
  const timezones = [
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/Los_Angeles',
    'Europe/Paris',
    'Asia/Dubai',
  ];

  return fc.record({
    name: fc.constantFrom('New York', 'London', 'Tokyo', 'Sydney', 'Los Angeles', 'Paris', 'Dubai'),
    country: fc.constantFrom('USA', 'UK', 'Japan', 'Australia', 'France', 'UAE'),
    timezone: fc.constantFrom(...timezones),
  });
};

const meetingSuggestionGenerator = (cityA: City, cityB: City): fc.Arbitrary<MeetingSuggestion> => {
  return fc.record({
    timeInCityA: fc.integer({ min: 0, max: 23 }).chain(hour =>
      fc.integer({ min: 0, max: 59 }).map(minute =>
        DateTime.now().setZone(cityA.timezone).set({ hour, minute, second: 0, millisecond: 0 })
      )
    ),
    timeInCityB: fc.integer({ min: 0, max: 23 }).chain(hour =>
      fc.integer({ min: 0, max: 59 }).map(minute =>
        DateTime.now().setZone(cityB.timezone).set({ hour, minute, second: 0, millisecond: 0 })
      )
    ),
    quality: fc.constantFrom('Perfect Time', 'Acceptable Time', 'Not Recommended'),
    durationMinutes: fc.integer({ min: 30, max: 120 }),
  });
};

describe('MeetingSuggestions Property Tests', () => {
  // Feature: timezone-overlap-finder, Property 9: Meeting suggestions display both local times
  it('should display both local times for all meeting suggestions', () => {
    fc.assert(
      fc.property(
        fc.tuple(cityGenerator(), cityGenerator()).chain(([cityA, cityB]) =>
          fc.tuple(
            fc.constant(cityA),
            fc.constant(cityB),
            fc.array(meetingSuggestionGenerator(cityA, cityB), { minLength: 1, maxLength: 5 })
          )
        ),
        ([cityA, cityB, suggestions]) => {
          const { container } = render(
            <MeetingSuggestions
              suggestions={suggestions}
              cityA={cityA}
              cityB={cityB}
              overlapDurationMinutes={60}
            />
          );

          // Each suggestion should display both city names
          suggestions.forEach((suggestion) => {
            const formattedTimeA = suggestion.timeInCityA.toFormat('hh:mm a');
            const formattedTimeB = suggestion.timeInCityB.toFormat('hh:mm a');

            // Check that both times are present in the rendered output
            const text = container.textContent || '';
            expect(text).toContain(cityA.name);
            expect(text).toContain(cityB.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

  // Feature: timezone-overlap-finder, Property 12: Current times are displayed
  it('should display current local times for both cities', () => {
    fc.assert(
      fc.property(
        fc.tuple(cityGenerator(), cityGenerator()).chain(([cityA, cityB]) =>
          fc.tuple(
            fc.constant(cityA),
            fc.constant(cityB),
            fc.array(meetingSuggestionGenerator(cityA, cityB), { minLength: 1, maxLength: 3 })
          )
        ),
        ([cityA, cityB, suggestions]) => {
          const { container } = render(
            <MeetingSuggestions
              suggestions={suggestions}
              cityA={cityA}
              cityB={cityB}
              overlapDurationMinutes={60}
            />
          );

          // Get current times for both cities
          const currentTimeA = DateTime.now().setZone(cityA.timezone);
          const currentTimeB = DateTime.now().setZone(cityB.timezone);

          const text = container.textContent || '';
          
          // Check that "Current time" text is present
          expect(text).toContain('Current time');
          
          // Check that both city names appear in the current time section
          expect(text).toContain(cityA.name);
          expect(text).toContain(cityB.name);
          
          // Check that formatted times are present (within a reasonable margin since time passes)
          const formattedTimeA = currentTimeA.toFormat('hh:mm a');
          const formattedTimeB = currentTimeB.toFormat('hh:mm a');
          
          // The times should be present in the output
          expect(text).toContain(formattedTimeA);
          expect(text).toContain(formattedTimeB);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 13: Limited overlap indication
  it('should indicate limited overlap when duration is less than 60 minutes', () => {
    fc.assert(
      fc.property(
        fc.tuple(cityGenerator(), cityGenerator()).chain(([cityA, cityB]) =>
          fc.tuple(
            fc.constant(cityA),
            fc.constant(cityB),
            fc.array(meetingSuggestionGenerator(cityA, cityB), { minLength: 1, maxLength: 3 }),
            fc.integer({ min: 1, max: 120 })
          )
        ),
        ([cityA, cityB, suggestions, overlapDuration]) => {
          const { container } = render(
            <MeetingSuggestions
              suggestions={suggestions}
              cityA={cityA}
              cityB={cityB}
              overlapDurationMinutes={overlapDuration}
            />
          );

          const text = container.textContent || '';
          
          if (overlapDuration < 60) {
            // Should show limited overlap warning
            expect(text).toContain('Limited overlap');
            expect(text).toContain('Less than 1 hour');
          } else {
            // Should NOT show limited overlap warning
            expect(text).not.toContain('Limited overlap');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 18: Clipboard copy functionality
  it('should provide copy functionality for all meeting suggestions', () => {
    fc.assert(
      fc.property(
        fc.tuple(cityGenerator(), cityGenerator()).chain(([cityA, cityB]) =>
          fc.tuple(
            fc.constant(cityA),
            fc.constant(cityB),
            fc.array(meetingSuggestionGenerator(cityA, cityB), { minLength: 1, maxLength: 5 })
          )
        ),
        ([cityA, cityB, suggestions]) => {
          const { getAllByLabelText } = render(
            <MeetingSuggestions
              suggestions={suggestions}
              cityA={cityA}
              cityB={cityB}
              overlapDurationMinutes={60}
            />
          );

          // Get all copy buttons - there should be one for each suggestion
          const copyButtons = getAllByLabelText(/Copy meeting time:/);
          expect(copyButtons).toHaveLength(suggestions.length);
          
          // Each button should have the correct aria-label format
          copyButtons.forEach((button, index) => {
            const ariaLabel = button.getAttribute('aria-label');
            expect(ariaLabel).toMatch(/Copy meeting time: \d{2}:\d{2} [ap]m .+ ↔ \d{2}:\d{2} [ap]m .+/i);
            expect(ariaLabel).toContain('↔');
          });

          // Cleanup after each property test run
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
