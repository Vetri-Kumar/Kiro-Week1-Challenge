import { describe, it, expect, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import { TimeZoneConverter } from './TimeZoneConverter';

describe('TimeZoneConverter', () => {
  let converter: TimeZoneConverter;

  beforeEach(() => {
    converter = new TimeZoneConverter();
  });

  describe('getCurrentTime', () => {
    it('should return current time in specified timezone', () => {
      const timezone = 'America/New_York';
      const currentTime = converter.getCurrentTime(timezone);
      
      expect(currentTime.zoneName).toBe(timezone);
      expect(currentTime.isValid).toBe(true);
    });

    it('should return current time in UTC', () => {
      const currentTime = converter.getCurrentTime('UTC');
      
      expect(currentTime.zoneName).toBe('UTC');
      expect(currentTime.isValid).toBe(true);
    });
  });

  describe('convertToUTC', () => {
    it('should convert New York time to UTC correctly', () => {
      // January 15, 2024, 12:00 PM in New York (EST, UTC-5)
      const nyTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: 'America/New_York' }
      );
      
      const utcTime = converter.convertToUTC(nyTime, 'America/New_York');
      
      expect(utcTime.zoneName).toBe('UTC');
      expect(utcTime.hour).toBe(17); // 12 PM + 5 hours = 5 PM UTC
    });

    it('should handle UTC timezone correctly', () => {
      const utcTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: 'UTC' }
      );
      
      const convertedTime = converter.convertToUTC(utcTime, 'UTC');
      
      expect(convertedTime.zoneName).toBe('UTC');
      expect(convertedTime.hour).toBe(12);
    });

    it('should handle timezone with 30-minute offset (India)', () => {
      // January 15, 2024, 12:00 PM in Kolkata (IST, UTC+5:30)
      const indiaTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: 'Asia/Kolkata' }
      );
      
      const utcTime = converter.convertToUTC(indiaTime, 'Asia/Kolkata');
      
      expect(utcTime.zoneName).toBe('UTC');
      expect(utcTime.hour).toBe(6); // 12 PM - 5:30 = 6:30 AM UTC
      expect(utcTime.minute).toBe(30);
    });

    it('should handle timezone with 45-minute offset (Nepal)', () => {
      // January 15, 2024, 12:00 PM in Kathmandu (NPT, UTC+5:45)
      const nepalTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: 'Asia/Kathmandu' }
      );
      
      const utcTime = converter.convertToUTC(nepalTime, 'Asia/Kathmandu');
      
      expect(utcTime.zoneName).toBe('UTC');
      expect(utcTime.hour).toBe(6); // 12 PM - 5:45 = 6:15 AM UTC
      expect(utcTime.minute).toBe(15);
    });
  });

  describe('convertFromUTC', () => {
    it('should convert UTC to New York time correctly', () => {
      // January 15, 2024, 5:00 PM UTC
      const utcTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 17, minute: 0 },
        { zone: 'UTC' }
      );
      
      const nyTime = converter.convertFromUTC(utcTime, 'America/New_York');
      
      expect(nyTime.zoneName).toBe('America/New_York');
      expect(nyTime.hour).toBe(12); // 5 PM - 5 hours = 12 PM EST
    });

    it('should convert UTC to Tokyo time correctly', () => {
      // January 15, 2024, 12:00 PM UTC
      const utcTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 12, minute: 0 },
        { zone: 'UTC' }
      );
      
      const tokyoTime = converter.convertFromUTC(utcTime, 'Asia/Tokyo');
      
      expect(tokyoTime.zoneName).toBe('Asia/Tokyo');
      expect(tokyoTime.hour).toBe(21); // 12 PM + 9 hours = 9 PM JST
    });
  });

  describe('DST transitions', () => {
    it('should handle spring DST transition in New York', () => {
      // March 10, 2024, 2:00 AM is when DST starts in New York (spring forward)
      // Before DST: EST (UTC-5)
      const beforeDST = DateTime.fromObject(
        { year: 2024, month: 3, day: 10, hour: 1, minute: 0 },
        { zone: 'America/New_York' }
      );
      
      // After DST: EDT (UTC-4)
      const afterDST = DateTime.fromObject(
        { year: 2024, month: 3, day: 10, hour: 3, minute: 0 },
        { zone: 'America/New_York' }
      );
      
      const beforeUTC = converter.convertToUTC(beforeDST, 'America/New_York');
      const afterUTC = converter.convertToUTC(afterDST, 'America/New_York');
      
      // The UTC times should be 2 hours apart (1 hour local + 1 hour DST change)
      const diffHours = afterUTC.diff(beforeUTC, 'hours').hours;
      expect(diffHours).toBe(1); // Only 1 hour passes in real time
    });

    it('should handle fall DST transition in New York', () => {
      // November 3, 2024, 2:00 AM is when DST ends in New York (fall back)
      // Before: EDT (UTC-4)
      const beforeDST = DateTime.fromObject(
        { year: 2024, month: 11, day: 3, hour: 1, minute: 0 },
        { zone: 'America/New_York' }
      );
      
      // After: EST (UTC-5)
      const afterDST = DateTime.fromObject(
        { year: 2024, month: 11, day: 3, hour: 3, minute: 0 },
        { zone: 'America/New_York' }
      );
      
      const beforeUTC = converter.convertToUTC(beforeDST, 'America/New_York');
      const afterUTC = converter.convertToUTC(afterDST, 'America/New_York');
      
      // During fall back, 2 hours of local time only equals 2 hours of UTC time
      // because the clock "falls back" but we're measuring from 1 AM to 3 AM
      const diffHours = afterUTC.diff(beforeUTC, 'hours').hours;
      expect(diffHours).toBe(2);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return correct offset for New York in winter (EST)', () => {
      const winterDate = new Date('2024-01-15');
      const offset = converter.getTimezoneOffset('America/New_York', winterDate);
      
      expect(offset).toBe(-300); // UTC-5 = -300 minutes
    });

    it('should return correct offset for New York in summer (EDT)', () => {
      const summerDate = new Date('2024-07-15');
      const offset = converter.getTimezoneOffset('America/New_York', summerDate);
      
      expect(offset).toBe(-240); // UTC-4 = -240 minutes
    });

    it('should return 0 for UTC', () => {
      const offset = converter.getTimezoneOffset('UTC');
      
      expect(offset).toBe(0);
    });

    it('should return correct offset for timezone with 30-minute offset', () => {
      const offset = converter.getTimezoneOffset('Asia/Kolkata');
      
      expect(offset).toBe(330); // UTC+5:30 = 330 minutes
    });

    it('should return correct offset for timezone with 45-minute offset', () => {
      const offset = converter.getTimezoneOffset('Asia/Kathmandu');
      
      expect(offset).toBe(345); // UTC+5:45 = 345 minutes
    });

    it('should use current date when no date is provided', () => {
      const offset = converter.getTimezoneOffset('America/New_York');
      
      // Offset should be either -300 (EST) or -240 (EDT)
      expect([-300, -240]).toContain(offset);
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid timezone in getCurrentTime', () => {
      expect(() => converter.getCurrentTime('Invalid/Timezone')).toThrow('Invalid timezone identifier');
    });

    it('should throw error for empty timezone in getCurrentTime', () => {
      expect(() => converter.getCurrentTime('')).toThrow('Invalid timezone identifier');
    });

    it('should throw error for invalid timezone in convertToUTC', () => {
      const time = DateTime.now();
      expect(() => converter.convertToUTC(time, 'Invalid/Timezone')).toThrow('Invalid timezone identifier');
    });

    it('should throw error for invalid DateTime in convertToUTC', () => {
      const invalidTime = DateTime.invalid('test');
      expect(() => converter.convertToUTC(invalidTime, 'America/New_York')).toThrow('Invalid DateTime object');
    });

    it('should throw error for invalid timezone in convertFromUTC', () => {
      const time = DateTime.utc();
      expect(() => converter.convertFromUTC(time, 'Invalid/Timezone')).toThrow('Invalid timezone identifier');
    });

    it('should throw error for invalid DateTime in convertFromUTC', () => {
      const invalidTime = DateTime.invalid('test');
      expect(() => converter.convertFromUTC(invalidTime, 'America/New_York')).toThrow('Invalid DateTime object');
    });

    it('should throw error for invalid timezone in getTimezoneOffset', () => {
      expect(() => converter.getTimezoneOffset('Invalid/Timezone')).toThrow('Invalid timezone identifier');
    });

    it('should validate timezone correctly', () => {
      expect(converter.isValidTimezone('America/New_York')).toBe(true);
      expect(converter.isValidTimezone('UTC')).toBe(true);
      expect(converter.isValidTimezone('Invalid/Timezone')).toBe(false);
      expect(converter.isValidTimezone('')).toBe(false);
    });
  });
});
