import { DateTime } from 'luxon';
import type { City, WorkingHours, OverlapResult } from '../types';
import { TimeZoneConverter } from '../utils/TimeZoneConverter';

/**
 * OverlapCalculator calculates overlapping working hours between two cities
 * in different time zones.
 */
export class OverlapCalculator {
  private converter: TimeZoneConverter;

  constructor() {
    this.converter = new TimeZoneConverter();
  }

  /**
   * Calculate the overlapping working hours between two cities
   * @param cityA - First city
   * @param cityB - Second city
   * @param workingHoursA - Working hours for city A (default: 9 AM - 6 PM)
   * @param workingHoursB - Working hours for city B (default: 9 AM - 6 PM)
   * @param date - Date to calculate overlap for (default: today)
   * @returns OverlapResult containing overlap information
   * @throws Error if cities or timezones are invalid
   */
  calculateOverlap(
    cityA: City,
    cityB: City,
    workingHoursA: WorkingHours = { start: 9, end: 18 },
    workingHoursB: WorkingHours = { start: 9, end: 18 },
    date: Date = new Date()
  ): OverlapResult {
    // Validate inputs
    if (!cityA || !cityA.timezone) {
      throw new Error('Invalid city A: Missing timezone information');
    }

    if (!cityB || !cityB.timezone) {
      throw new Error('Invalid city B: Missing timezone information');
    }

    if (!this.converter.isValidTimezone(cityA.timezone)) {
      throw new Error(`Unable to determine timezone for ${cityA.name}. Please try another city.`);
    }

    if (!this.converter.isValidTimezone(cityB.timezone)) {
      throw new Error(`Unable to determine timezone for ${cityB.name}. Please try another city.`);
    }

    // Validate working hours
    if (!this.isValidWorkingHours(workingHoursA)) {
      throw new Error('Invalid working hours for City A');
    }

    if (!this.isValidWorkingHours(workingHoursB)) {
      throw new Error('Invalid working hours for City B');
    }

    try {
      // Convert working hours to UTC time ranges
      const rangeA = this.workingHoursToUTC(workingHoursA, cityA.timezone, date);
      const rangeB = this.workingHoursToUTC(workingHoursB, cityB.timezone, date);

      // Calculate intersection
      const intersection = this.calculateIntersection(rangeA, rangeB);

      if (!intersection) {
        return { hasOverlap: false };
      }

      // Convert overlap back to local times
      const overlapInCityA = {
        start: this.converter.convertFromUTC(intersection.start, cityA.timezone),
        end: this.converter.convertFromUTC(intersection.end, cityA.timezone)
      };

      const overlapInCityB = {
        start: this.converter.convertFromUTC(intersection.start, cityB.timezone),
        end: this.converter.convertFromUTC(intersection.end, cityB.timezone)
      };

      const durationMinutes = intersection.end.diff(intersection.start, 'minutes').minutes;

      return {
        hasOverlap: true,
        overlapInUTC: intersection,
        overlapInCityA,
        overlapInCityB,
        durationMinutes
      };
    } catch (error) {
      // Re-throw with more context if it's already an error we threw
      if (error instanceof Error && error.message.includes('timezone')) {
        throw error;
      }
      // Otherwise wrap in a generic error
      throw new Error('Failed to calculate overlap. Please check your inputs and try again.');
    }
  }

  /**
   * Validate working hours
   * @param hours - Working hours to validate
   * @returns true if valid, false otherwise
   */
  private isValidWorkingHours(hours: WorkingHours): boolean {
    return (
      hours &&
      typeof hours.start === 'number' &&
      typeof hours.end === 'number' &&
      hours.start >= 0 &&
      hours.start < 24 &&
      hours.end >= 0 &&
      hours.end <= 24 &&
      hours.start !== hours.end
    );
  }

  /**
   * Convert working hours in a specific timezone to a UTC time range
   * Handles edge cases like working hours spanning midnight
   */
  private workingHoursToUTC(
    workingHours: WorkingHours,
    timezone: string,
    date: Date
  ): { start: DateTime; end: DateTime } {
    // Create DateTime objects for the start and end of working hours
    const baseDate = DateTime.fromJSDate(date).setZone(timezone).startOf('day');
    
    let start = baseDate.set({ hour: workingHours.start, minute: 0, second: 0, millisecond: 0 });
    let end = baseDate.set({ hour: workingHours.end, minute: 0, second: 0, millisecond: 0 });

    // Handle case where end time is before or equal to start time (spanning midnight)
    if (workingHours.end <= workingHours.start) {
      // End time is on the next day
      end = end.plus({ days: 1 });
    }

    // Convert to UTC
    const startUTC = this.converter.convertToUTC(start, timezone);
    const endUTC = this.converter.convertToUTC(end, timezone);

    return { start: startUTC, end: endUTC };
  }

  /**
   * Calculate the intersection of two time ranges
   * Returns null if there is no overlap
   */
  private calculateIntersection(
    rangeA: { start: DateTime; end: DateTime },
    rangeB: { start: DateTime; end: DateTime }
  ): { start: DateTime; end: DateTime } | null {
    // The intersection starts at the later of the two start times
    const intersectionStart = rangeA.start > rangeB.start ? rangeA.start : rangeB.start;
    
    // The intersection ends at the earlier of the two end times
    const intersectionEnd = rangeA.end < rangeB.end ? rangeA.end : rangeB.end;

    // If the intersection start is after or equal to the intersection end, there's no overlap
    if (intersectionStart >= intersectionEnd) {
      return null;
    }

    return { start: intersectionStart, end: intersectionEnd };
  }
}
