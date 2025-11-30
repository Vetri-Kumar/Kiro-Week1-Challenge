import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DateTime } from 'luxon';
import { TimeZoneConverter } from './TimeZoneConverter';

describe('TimeZoneConverter - Property-Based Tests', () => {
  const converter = new TimeZoneConverter();

  // Common IANA timezone identifiers for testing
  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata', // UTC+5:30 (30-minute offset)
    'Australia/Sydney',
    'Australia/Adelaide', // UTC+9:30 (30-minute offset)
    'Pacific/Auckland',
    'Asia/Kathmandu', // UTC+5:45 (45-minute offset)
    'Pacific/Chatham', // UTC+12:45 (45-minute offset)
  ];

  // Generator for valid timezones
  const timezoneArb = fc.constantFrom(...commonTimezones);

  // Generator for DateTime objects
  const dateTimeArb = fc.date({
    min: new Date('2020-01-01'),
    max: new Date('2030-12-31'),
  }).map(date => DateTime.fromJSDate(date));

  /**
   * Feature: timezone-overlap-finder, Property 6: Time zone conversion round-trip accuracy
   * Validates: Requirements 2.2, 3.2, 3.5
   * 
   * For any city with a valid timezone, converting the current time to that timezone
   * and then to UTC and back should preserve the original time (within the same minute).
   */
  it('Property 6: Time zone conversion round-trip accuracy', () => {
    fc.assert(
      fc.property(
        timezoneArb,
        dateTimeArb,
        (timezone, originalTime) => {
          // Set the original time to the specified timezone
          const timeInZone = originalTime.setZone(timezone);
          
          // Convert to UTC
          const timeInUTC = converter.convertToUTC(timeInZone, timezone);
          
          // Convert back to the original timezone
          const roundTripTime = converter.convertFromUTC(timeInUTC, timezone);
          
          // The times should be equal within the same minute
          // We use minute precision because of potential rounding in conversions
          const originalMinute = timeInZone.startOf('minute');
          const roundTripMinute = roundTripTime.startOf('minute');
          
          expect(roundTripMinute.toMillis()).toBe(originalMinute.toMillis());
        }
      ),
      { numRuns: 100 }
    );
  });
});
