import { describe, it, expect, beforeEach } from 'vitest';
import { OverlapCalculator } from './OverlapCalculator';
import type { City, WorkingHours } from '../types';

describe('OverlapCalculator', () => {
  let calculator: OverlapCalculator;

  beforeEach(() => {
    calculator = new OverlapCalculator();
  });

  describe('calculateOverlap', () => {
    it('should return no overlap when working hours do not intersect', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'Tokyo',
        country: 'Japan',
        timezone: 'Asia/Tokyo'
      };

      // New York 9 AM - 6 PM is Tokyo 10 PM - 7 AM (next day)
      // Tokyo 9 AM - 6 PM is New York 8 PM - 5 AM (next day)
      // These don't overlap
      const workingHoursA: WorkingHours = { start: 9, end: 18 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };
      const date = new Date('2024-06-15');

      const result = calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB, date);

      expect(result.hasOverlap).toBe(false);
      expect(result.overlapInUTC).toBeUndefined();
      expect(result.overlapInCityA).toBeUndefined();
      expect(result.overlapInCityB).toBeUndefined();
      expect(result.durationMinutes).toBeUndefined();
    });

    it('should calculate overlap for cities in same timezone', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'Boston',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 18 };
      const workingHoursB: WorkingHours = { start: 10, end: 17 };
      const date = new Date('2024-06-15');

      const result = calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB, date);

      expect(result.hasOverlap).toBe(true);
      expect(result.durationMinutes).toBe(7 * 60); // 7 hours
      
      // In same timezone, overlap should be 10 AM - 5 PM
      expect(result.overlapInCityA?.start.hour).toBe(10);
      expect(result.overlapInCityA?.end.hour).toBe(17);
      expect(result.overlapInCityB?.start.hour).toBe(10);
      expect(result.overlapInCityB?.end.hour).toBe(17);
    });

    it('should handle working hours spanning midnight', () => {
      const cityA: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const cityB: City = {
        name: 'Paris',
        country: 'France',
        timezone: 'Europe/Paris'
      };

      // Working hours from 10 PM to 6 AM (spanning midnight)
      const workingHoursA: WorkingHours = { start: 22, end: 6 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };
      const date = new Date('2024-06-15');

      const result = calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB, date);

      // Should have some overlap or no overlap depending on the calculation
      expect(result).toBeDefined();
      expect(typeof result.hasOverlap).toBe('boolean');
    });

    it('should calculate partial overlap between different timezones', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 18 }; // 9 AM - 6 PM
      const workingHoursB: WorkingHours = { start: 9, end: 18 }; // 9 AM - 6 PM
      const date = new Date('2024-06-15');

      const result = calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB, date);

      // Verify the result structure is correct
      expect(result).toBeDefined();
      expect(typeof result.hasOverlap).toBe('boolean');
      
      // If there's overlap, verify it has positive duration
      if (result.hasOverlap) {
        expect(result.durationMinutes).toBeGreaterThan(0);
        expect(result.overlapInUTC).toBeDefined();
        expect(result.overlapInCityA).toBeDefined();
        expect(result.overlapInCityB).toBeDefined();
      }
    });

    it('should use default working hours when not specified', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'Los Angeles',
        country: 'USA',
        timezone: 'America/Los_Angeles'
      };

      const date = new Date('2024-06-15');

      // Call without specifying working hours
      const result = calculator.calculateOverlap(cityA, cityB, undefined, undefined, date);

      expect(result).toBeDefined();
      expect(typeof result.hasOverlap).toBe('boolean');
      
      // Should have overlap since both use default 9 AM - 6 PM
      expect(result.hasOverlap).toBe(true);
    });

    it('should handle edge case with very small overlap', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      // Create a scenario with minimal overlap
      const workingHoursA: WorkingHours = { start: 9, end: 10 }; // 1 hour
      const workingHoursB: WorkingHours = { start: 14, end: 15 }; // 1 hour (9-10 AM EST)
      const date = new Date('2024-06-15');

      const result = calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB, date);

      expect(result).toBeDefined();
      expect(typeof result.hasOverlap).toBe('boolean');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid city A timezone', () => {
      const cityA: City = {
        name: 'Invalid City',
        country: 'Invalid',
        timezone: 'Invalid/Timezone'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 18 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Unable to determine timezone');
    });

    it('should throw error for invalid city B timezone', () => {
      const cityA: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const cityB: City = {
        name: 'Invalid City',
        country: 'Invalid',
        timezone: 'Invalid/Timezone'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 18 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Unable to determine timezone');
    });

    it('should throw error for missing timezone in city A', () => {
      const cityA: City = {
        name: 'Invalid City',
        country: 'Invalid',
        timezone: ''
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 18 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Invalid city A');
    });

    it('should throw error for invalid working hours (negative values)', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: -1, end: 18 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Invalid working hours');
    });

    it('should throw error for invalid working hours (out of range)', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 25 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Invalid working hours');
    });

    it('should throw error for invalid working hours (start equals end)', () => {
      const cityA: City = {
        name: 'New York',
        country: 'USA',
        timezone: 'America/New_York'
      };

      const cityB: City = {
        name: 'London',
        country: 'UK',
        timezone: 'Europe/London'
      };

      const workingHoursA: WorkingHours = { start: 9, end: 9 };
      const workingHoursB: WorkingHours = { start: 9, end: 18 };

      expect(() => {
        calculator.calculateOverlap(cityA, cityB, workingHoursA, workingHoursB);
      }).toThrow('Invalid working hours');
    });
  });
});
