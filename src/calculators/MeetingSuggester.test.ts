import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import { MeetingSuggester } from './MeetingSuggester';
import type { OverlapResult, City, WorkingHours } from '../types';

describe('MeetingSuggester', () => {
  const suggester = new MeetingSuggester();

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

  const defaultWorkingHours: WorkingHours = { start: 9, end: 18 };

  describe('generateSuggestions', () => {
    it('should generate suggestions at 30-minute intervals', () => {
      const overlap: OverlapResult = {
        hasOverlap: true,
        overlapInUTC: {
          start: DateTime.utc(2024, 1, 15, 14, 0),
          end: DateTime.utc(2024, 1, 15, 16, 0)
        },
        overlapInCityA: {
          start: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 9, minute: 0 }, { zone: 'America/New_York' }),
          end: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 11, minute: 0 }, { zone: 'America/New_York' })
        },
        overlapInCityB: {
          start: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 14, minute: 0 }, { zone: 'Europe/London' }),
          end: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 16, minute: 0 }, { zone: 'Europe/London' })
        },
        durationMinutes: 120
      };

      const suggestions = suggester.generateSuggestions(overlap, cityA, cityB, defaultWorkingHours, defaultWorkingHours);

      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check that suggestions are 30 minutes apart
      for (let i = 1; i < suggestions.length; i++) {
        const diff = suggestions[i].timeInCityA.diff(suggestions[i - 1].timeInCityA, 'minutes').minutes;
        expect(diff).toBe(30);
      }
    });

    it('should return empty array when there is no overlap', () => {
      const overlap: OverlapResult = {
        hasOverlap: false
      };

      const suggestions = suggester.generateSuggestions(overlap, cityA, cityB, defaultWorkingHours, defaultWorkingHours);

      expect(suggestions).toEqual([]);
    });

    it('should handle overlap less than 1 hour', () => {
      const overlap: OverlapResult = {
        hasOverlap: true,
        overlapInUTC: {
          start: DateTime.utc(2024, 1, 15, 14, 0),
          end: DateTime.utc(2024, 1, 15, 14, 45)
        },
        overlapInCityA: {
          start: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 9, minute: 0 }, { zone: 'America/New_York' }),
          end: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 9, minute: 45 }, { zone: 'America/New_York' })
        },
        overlapInCityB: {
          start: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 14, minute: 0 }, { zone: 'Europe/London' }),
          end: DateTime.fromObject({ year: 2024, month: 1, day: 15, hour: 14, minute: 45 }, { zone: 'Europe/London' })
        },
        durationMinutes: 45
      };

      const suggestions = suggester.generateSuggestions(overlap, cityA, cityB, defaultWorkingHours, defaultWorkingHours);

      expect(suggestions.length).toBeGreaterThan(0);
      // Should have at least one suggestion even with short overlap
      expect(suggestions[0].durationMinutes).toBeLessThanOrEqual(45);
    });
  });

  describe('categorizeMeetingTime', () => {
    it('should categorize middle of working hours as "Perfect Time"', () => {
      const workingHours: WorkingHours = { start: 9, end: 18 }; // 9 AM - 6 PM
      const middleTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 13, minute: 30 }, // 1:30 PM (middle of 9-6)
        { zone: 'America/New_York' }
      );

      const quality = suggester.categorizeMeetingTime(middleTime, workingHours, 'America/New_York');

      expect(quality).toBe('Perfect Time');
    });

    it('should categorize early morning as "Acceptable Time"', () => {
      const workingHours: WorkingHours = { start: 9, end: 18 };
      const earlyTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 9, minute: 30 }, // 9:30 AM
        { zone: 'America/New_York' }
      );

      const quality = suggester.categorizeMeetingTime(earlyTime, workingHours, 'America/New_York');

      expect(quality).toBe('Acceptable Time');
    });

    it('should categorize late afternoon as "Acceptable Time"', () => {
      const workingHours: WorkingHours = { start: 9, end: 18 };
      const lateTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 17, minute: 0 }, // 5:00 PM
        { zone: 'America/New_York' }
      );

      const quality = suggester.categorizeMeetingTime(lateTime, workingHours, 'America/New_York');

      expect(quality).toBe('Acceptable Time');
    });

    it('should categorize time outside working hours as "Not Recommended"', () => {
      const workingHours: WorkingHours = { start: 9, end: 18 };
      const outsideTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 8, minute: 0 }, // 8:00 AM (before work)
        { zone: 'America/New_York' }
      );

      const quality = suggester.categorizeMeetingTime(outsideTime, workingHours, 'America/New_York');

      expect(quality).toBe('Not Recommended');
    });

    it('should handle boundary conditions correctly', () => {
      const workingHours: WorkingHours = { start: 9, end: 18 };
      
      // Exactly at start time
      const startTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 9, minute: 0 },
        { zone: 'America/New_York' }
      );
      const startQuality = suggester.categorizeMeetingTime(startTime, workingHours, 'America/New_York');
      expect(startQuality).not.toBe('Not Recommended');

      // At end time (should be outside)
      const endTime = DateTime.fromObject(
        { year: 2024, month: 1, day: 15, hour: 18, minute: 0 },
        { zone: 'America/New_York' }
      );
      const endQuality = suggester.categorizeMeetingTime(endTime, workingHours, 'America/New_York');
      expect(endQuality).toBe('Not Recommended');
    });
  });

  describe('formatMeetingSuggestion', () => {
    it('should format suggestion with correct pattern', () => {
      const suggestion = {
        timeInCityA: DateTime.fromObject(
          { year: 2024, month: 1, day: 15, hour: 10, minute: 30 },
          { zone: 'America/New_York' }
        ),
        timeInCityB: DateTime.fromObject(
          { year: 2024, month: 1, day: 15, hour: 15, minute: 30 },
          { zone: 'Europe/London' }
        ),
        quality: 'Perfect Time' as const,
        durationMinutes: 60
      };

      const formatted = suggester.formatMeetingSuggestion(suggestion, cityA, cityB);

      expect(formatted).toContain('10:30 AM');
      expect(formatted).toContain('03:30 PM');
      expect(formatted).toContain('New York');
      expect(formatted).toContain('London');
      expect(formatted).toContain('↔');
    });
  });

  describe('findLargestOverlap', () => {
    it('should identify the suggestion with longest duration', () => {
      const suggestions = [
        {
          timeInCityA: DateTime.now(),
          timeInCityB: DateTime.now(),
          quality: 'Perfect Time' as const,
          durationMinutes: 30
        },
        {
          timeInCityA: DateTime.now(),
          timeInCityB: DateTime.now(),
          quality: 'Perfect Time' as const,
          durationMinutes: 60
        },
        {
          timeInCityA: DateTime.now(),
          timeInCityB: DateTime.now(),
          quality: 'Perfect Time' as const,
          durationMinutes: 45
        }
      ];

      const largest = suggester.findLargestOverlap(suggestions);

      expect(largest).not.toBeNull();
      expect(largest?.durationMinutes).toBe(60);
    });

    it('should return null for empty array', () => {
      const largest = suggester.findLargestOverlap([]);

      expect(largest).toBeNull();
    });
  });
});
