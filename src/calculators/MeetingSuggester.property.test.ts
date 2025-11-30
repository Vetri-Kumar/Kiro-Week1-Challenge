import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DateTime } from 'luxon';
import { MeetingSuggester } from './MeetingSuggester';
import type { MeetingSuggestion, City, WorkingHours } from '../types';

describe('MeetingSuggester - Property-Based Tests', () => {
  const suggester = new MeetingSuggester();

  // Arbitraries for generating test data
  const cityArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    country: fc.string({ minLength: 1, maxLength: 20 }),
    timezone: fc.constantFrom(
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'America/Los_Angeles',
      'Europe/Paris',
      'Asia/Dubai'
    )
  }) as fc.Arbitrary<City>;

  const dateTimeArbitrary = fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })
    .chain(date => {
      return fc.constantFrom(
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney'
      ).map(tz => {
        const dt = DateTime.fromJSDate(date).setZone(tz);
        // Ensure valid DateTime
        return dt.isValid ? dt : DateTime.now().setZone(tz);
      });
    });

  const workingHoursArbitrary = fc.record({
    start: fc.integer({ min: 0, max: 22 }),
    end: fc.integer({ min: 1, max: 23 })
  }).filter(wh => wh.end > wh.start) as fc.Arbitrary<WorkingHours>;

  const meetingSuggestionArbitrary = fc.record({
    timeInCityA: dateTimeArbitrary,
    timeInCityB: dateTimeArbitrary,
    quality: fc.constantFrom('Perfect Time', 'Acceptable Time', 'Not Recommended'),
    durationMinutes: fc.integer({ min: 30, max: 480 })
  }) as fc.Arbitrary<MeetingSuggestion>;

  // Feature: timezone-overlap-finder, Property 10: Meeting time format consistency
  // Validates: Requirements 4.2
  it('should format meeting times consistently as "HH:MM AM/PM CityA ↔ HH:MM AM/PM CityB"', () => {
    fc.assert(
      fc.property(
        meetingSuggestionArbitrary,
        cityArbitrary,
        cityArbitrary,
        (suggestion, cityA, cityB) => {
          const formatted = suggester.formatMeetingSuggestion(suggestion, cityA, cityB);
          
          // Check format matches pattern: "HH:MM AM/PM CityName ↔ HH:MM AM/PM CityName"
          const pattern = /^\d{2}:\d{2} [AP]M .+ ↔ \d{2}:\d{2} [AP]M .+$/;
          expect(formatted).toMatch(pattern);
          
          // Check that both city names appear in the formatted string
          expect(formatted).toContain(cityA.name);
          expect(formatted).toContain(cityB.name);
          
          // Check that the arrow separator is present
          expect(formatted).toContain('↔');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 19: Meeting quality categorization completeness
  // Validates: Requirements 9.1
  it('should assign exactly one quality category to each meeting time', () => {
    fc.assert(
      fc.property(
        dateTimeArbitrary,
        workingHoursArbitrary,
        fc.constantFrom('America/New_York', 'Europe/London', 'Asia/Tokyo'),
        (time, workingHours, timezone) => {
          const quality = suggester.categorizeMeetingTime(time, workingHours, timezone);
          
          // Check that quality is one of the three valid categories
          const validQualities = ['Perfect Time', 'Acceptable Time', 'Not Recommended'];
          expect(validQualities).toContain(quality);
          
          // Check that it's exactly one category (string type ensures this)
          expect(typeof quality).toBe('string');
          expect(quality.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 20: Perfect time categorization accuracy
  // Validates: Requirements 9.2
  it('should categorize times in the middle third of working hours as "Perfect Time"', () => {
    fc.assert(
      fc.property(
        workingHoursArbitrary.filter(wh => (wh.end - wh.start) >= 3), // Need at least 3 hours for distinct thirds
        fc.constantFrom('America/New_York', 'Europe/London', 'Asia/Tokyo'),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        (workingHours, timezone, date) => {
          // Calculate middle third of working hours in minutes
          const totalMinutes = (workingHours.end - workingHours.start) * 60;
          const middleStartMinutes = workingHours.start * 60 + totalMinutes / 3;
          const middleEndMinutes = workingHours.start * 60 + (2 * totalMinutes) / 3;
          
          // Pick a time in the middle third (in minutes from midnight)
          const middleMinutes = (middleStartMinutes + middleEndMinutes) / 2;
          const hour = Math.floor(middleMinutes / 60);
          const minute = Math.floor(middleMinutes % 60);
          
          const time = DateTime.fromJSDate(date)
            .setZone(timezone)
            .set({ hour, minute, second: 0, millisecond: 0 });
          
          const quality = suggester.categorizeMeetingTime(time, workingHours, timezone);
          
          expect(quality).toBe('Perfect Time');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 21: Acceptable time categorization accuracy
  // Validates: Requirements 9.3
  it('should categorize times in first or last third as "Acceptable Time"', () => {
    fc.assert(
      fc.property(
        workingHoursArbitrary,
        fc.constantFrom('America/New_York', 'Europe/London', 'Asia/Tokyo'),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        fc.boolean(),
        (workingHours, timezone, date, useFirstThird) => {
          const totalMinutes = (workingHours.end - workingHours.start) * 60;
          
          let testMinutes: number;
          if (useFirstThird) {
            // Pick a time in the first third (in minutes from start of working hours)
            const firstThirdEndMinutes = workingHours.start * 60 + totalMinutes / 3;
            testMinutes = (workingHours.start * 60 + firstThirdEndMinutes) / 2;
          } else {
            // Pick a time in the last third
            const lastThirdStartMinutes = workingHours.start * 60 + (2 * totalMinutes) / 3;
            testMinutes = (lastThirdStartMinutes + workingHours.end * 60) / 2;
          }
          
          const hour = Math.floor(testMinutes / 60);
          const minute = Math.floor(testMinutes % 60);
          
          const time = DateTime.fromJSDate(date)
            .setZone(timezone)
            .set({ hour, minute, second: 0, millisecond: 0 });
          
          const quality = suggester.categorizeMeetingTime(time, workingHours, timezone);
          
          expect(quality).toBe('Acceptable Time');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 22: Not recommended categorization accuracy
  // Validates: Requirements 9.4
  it('should categorize times outside working hours as "Not Recommended"', () => {
    fc.assert(
      fc.property(
        workingHoursArbitrary,
        fc.constantFrom('America/New_York', 'Europe/London', 'Asia/Tokyo'),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }),
        fc.boolean(),
        (workingHours, timezone, date, useBefore) => {
          let testHour: number;
          if (useBefore) {
            // Pick a time before working hours
            testHour = Math.max(0, workingHours.start - 1);
          } else {
            // Pick a time after working hours
            testHour = Math.min(23, workingHours.end);
          }
          
          // Skip if we can't create a valid outside-hours time
          if ((useBefore && testHour >= workingHours.start) || 
              (!useBefore && testHour < workingHours.end)) {
            return true; // Skip this test case
          }
          
          const time = DateTime.fromJSDate(date)
            .setZone(timezone)
            .set({ hour: testHour, minute: 30, second: 0, millisecond: 0 });
          
          const quality = suggester.categorizeMeetingTime(time, workingHours, timezone);
          
          expect(quality).toBe('Not Recommended');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: timezone-overlap-finder, Property 11: Largest overlap is identified
  // Validates: Requirements 4.3
  it('should correctly identify the suggestion with the largest duration', () => {
    fc.assert(
      fc.property(
        fc.array(meetingSuggestionArbitrary, { minLength: 1, maxLength: 10 }),
        (suggestions) => {
          const largest = suggester.findLargestOverlap(suggestions);
          
          expect(largest).not.toBeNull();
          
          if (largest) {
            // Verify that no other suggestion has a larger duration
            for (const suggestion of suggestions) {
              expect(largest.durationMinutes).toBeGreaterThanOrEqual(suggestion.durationMinutes);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
