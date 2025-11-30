import { DateTime } from 'luxon';

/**
 * TimeZoneConverter provides utilities for converting times between different time zones
 * and handling DST transitions correctly using Luxon.
 */
export class TimeZoneConverter {
  /**
   * Validate if a timezone identifier is valid
   * @param timezone - IANA timezone identifier to validate
   * @returns true if valid, false otherwise
   */
  isValidTimezone(timezone: string): boolean {
    if (!timezone || typeof timezone !== 'string') {
      return false;
    }

    try {
      const dt = DateTime.now().setZone(timezone);
      // Check if the zone is valid (Luxon returns the original zone if invalid)
      return dt.isValid && dt.zoneName === timezone;
    } catch {
      return false;
    }
  }

  /**
   * Get the current time in a specific timezone
   * @param timezone - IANA timezone identifier (e.g., "America/New_York")
   * @returns DateTime object representing current time in the specified timezone
   * @throws Error if timezone is invalid
   */
  getCurrentTime(timezone: string): DateTime {
    if (!this.isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone identifier: ${timezone}`);
    }

    const dt = DateTime.now().setZone(timezone);
    
    if (!dt.isValid) {
      throw new Error(`Unable to get current time for timezone: ${timezone}`);
    }

    return dt;
  }

  /**
   * Convert a DateTime to UTC
   * @param time - DateTime object to convert
   * @param timezone - IANA timezone identifier of the source time
   * @returns DateTime object in UTC
   * @throws Error if timezone is invalid or conversion fails
   */
  convertToUTC(time: DateTime, timezone: string): DateTime {
    if (!this.isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone identifier: ${timezone}`);
    }

    if (!time.isValid) {
      throw new Error('Invalid DateTime object provided for conversion');
    }

    // Ensure the time is in the specified timezone, then convert to UTC
    const timeInZone = time.setZone(timezone, { keepLocalTime: true });
    
    if (!timeInZone.isValid) {
      throw new Error(`Failed to convert time to timezone: ${timezone}`);
    }

    const utcTime = timeInZone.toUTC();
    
    if (!utcTime.isValid) {
      throw new Error('Failed to convert time to UTC');
    }

    return utcTime;
  }

  /**
   * Convert a DateTime from UTC to a specific timezone
   * @param time - DateTime object in UTC
   * @param timezone - IANA timezone identifier for the target timezone
   * @returns DateTime object in the specified timezone
   * @throws Error if timezone is invalid or conversion fails
   */
  convertFromUTC(time: DateTime, timezone: string): DateTime {
    if (!this.isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone identifier: ${timezone}`);
    }

    if (!time.isValid) {
      throw new Error('Invalid DateTime object provided for conversion');
    }

    // Ensure the time is in UTC, then convert to the target timezone
    const timeInUTC = time.toUTC();
    
    if (!timeInUTC.isValid) {
      throw new Error('Failed to convert time to UTC');
    }

    const convertedTime = timeInUTC.setZone(timezone);
    
    if (!convertedTime.isValid) {
      throw new Error(`Failed to convert time to timezone: ${timezone}`);
    }

    return convertedTime;
  }

  /**
   * Get the timezone offset in minutes for a specific timezone at a given date
   * @param timezone - IANA timezone identifier
   * @param date - Optional date to check offset (defaults to current date)
   * @returns Offset in minutes from UTC (positive for east of UTC, negative for west)
   * @throws Error if timezone is invalid
   */
  getTimezoneOffset(timezone: string, date?: Date): number {
    if (!this.isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone identifier: ${timezone}`);
    }

    const dt = date 
      ? DateTime.fromJSDate(date).setZone(timezone)
      : DateTime.now().setZone(timezone);
    
    if (!dt.isValid) {
      throw new Error(`Failed to get timezone offset for: ${timezone}`);
    }

    return dt.offset;
  }
}
