import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { TimelineVisualizer } from './TimelineVisualizer';
import type { City, WorkingHours, OverlapResult } from '../types';
import { DateTime } from 'luxon';

// Feature: timezone-overlap-finder, Property 14: Visual timeline completeness
// Validates: Requirements 5.1, 5.2, 5.3

describe('TimelineVisualizer Property Tests', () => {
  // Generator for valid cities
  const cityArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    country: fc.string({ minLength: 1, maxLength: 50 }),
    timezone: fc.constantFrom(
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'America/Los_Angeles',
      'Europe/Paris',
      'Asia/Dubai',
      'America/Chicago'
    ),
  }) as fc.Arbitrary<City>;

  // Generator for valid working hours
  const workingHoursArbitrary = fc
    .tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 1, max: 12 }))
    .map(([start, duration]) => ({
      start,
      end: (start + duration) % 24,
    })) as fc.Arbitrary<WorkingHours>;

  // Generator for overlap result with overlap
  const overlapResultWithOverlapArbitrary = (
    cityA: City,
    cityB: City
  ): fc.Arbitrary<OverlapResult> => {
    return fc
      .tuple(
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 1, max: 8 })
      )
      .map(([startHour, durationHours]) => {
        const startUTC = DateTime.utc().set({ hour: startHour, minute: 0, second: 0 });
        const endUTC = startUTC.plus({ hours: durationHours });

        return {
          hasOverlap: true,
          overlapInUTC: { start: startUTC, end: endUTC },
          overlapInCityA: {
            start: startUTC.setZone(cityA.timezone),
            end: endUTC.setZone(cityA.timezone),
          },
          overlapInCityB: {
            start: startUTC.setZone(cityB.timezone),
            end: endUTC.setZone(cityB.timezone),
          },
          durationMinutes: durationHours * 60,
        };
      });
  };

  it('should display distinct visual elements for City A, City B, and overlap when overlap exists', () => {
    fc.assert(
      fc.property(
        cityArbitrary,
        cityArbitrary,
        workingHoursArbitrary,
        workingHoursArbitrary,
        (cityA, cityB, workingHoursA, workingHoursB) => {
          // Generate overlap result
          const startHour = 10;
          const durationHours = 4;
          const startUTC = DateTime.utc().set({ hour: startHour, minute: 0, second: 0 });
          const endUTC = startUTC.plus({ hours: durationHours });

          const overlap: OverlapResult = {
            hasOverlap: true,
            overlapInUTC: { start: startUTC, end: endUTC },
            overlapInCityA: {
              start: startUTC.setZone(cityA.timezone),
              end: endUTC.setZone(cityA.timezone),
            },
            overlapInCityB: {
              start: startUTC.setZone(cityB.timezone),
              end: endUTC.setZone(cityB.timezone),
            },
            durationMinutes: durationHours * 60,
          };

          const { container } = render(
            <TimelineVisualizer
              cityA={cityA}
              cityB={cityB}
              workingHoursA={workingHoursA}
              workingHoursB={workingHoursB}
              overlap={overlap}
            />
          );

          // Check for City A working hours block
          const cityABlock = container.querySelector('.city-a-block');
          expect(cityABlock).toBeTruthy();

          // Check for City B working hours block
          const cityBBlock = container.querySelector('.city-b-block');
          expect(cityBBlock).toBeTruthy();

          // Check for overlap block
          const overlapBlock = container.querySelector('.overlap-block');
          expect(overlapBlock).toBeTruthy();

          // Verify city names are displayed
          expect(container.textContent).toContain(cityA.name);
          expect(container.textContent).toContain(cityB.name);

          // Verify overlap indication
          expect(container.textContent).toContain('Overlap');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display City A and City B blocks without overlap block when no overlap exists', () => {
    fc.assert(
      fc.property(
        cityArbitrary,
        cityArbitrary,
        workingHoursArbitrary,
        workingHoursArbitrary,
        (cityA, cityB, workingHoursA, workingHoursB) => {
          const noOverlap: OverlapResult = {
            hasOverlap: false,
          };

          const { container } = render(
            <TimelineVisualizer
              cityA={cityA}
              cityB={cityB}
              workingHoursA={workingHoursA}
              workingHoursB={workingHoursB}
              overlap={noOverlap}
            />
          );

          // Check for City A working hours block
          const cityABlock = container.querySelector('.city-a-block');
          expect(cityABlock).toBeTruthy();

          // Check for City B working hours block
          const cityBBlock = container.querySelector('.city-b-block');
          expect(cityBBlock).toBeTruthy();

          // Check that overlap block does NOT exist
          const overlapBlock = container.querySelector('.overlap-block');
          expect(overlapBlock).toBeFalsy();

          // Verify "No Overlap" indication using container
          expect(container.textContent).toContain('No Overlap');
          expect(container.textContent).toContain('No overlapping hours');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always display all three timeline rows regardless of overlap', () => {
    fc.assert(
      fc.property(
        cityArbitrary,
        cityArbitrary,
        workingHoursArbitrary,
        workingHoursArbitrary,
        fc.boolean(),
        (cityA, cityB, workingHoursA, workingHoursB, hasOverlap) => {
          const overlap: OverlapResult = hasOverlap
            ? {
                hasOverlap: true,
                overlapInUTC: {
                  start: DateTime.utc().set({ hour: 10, minute: 0 }),
                  end: DateTime.utc().set({ hour: 14, minute: 0 }),
                },
                overlapInCityA: {
                  start: DateTime.utc().set({ hour: 10, minute: 0 }).setZone(cityA.timezone),
                  end: DateTime.utc().set({ hour: 14, minute: 0 }).setZone(cityA.timezone),
                },
                overlapInCityB: {
                  start: DateTime.utc().set({ hour: 10, minute: 0 }).setZone(cityB.timezone),
                  end: DateTime.utc().set({ hour: 14, minute: 0 }).setZone(cityB.timezone),
                },
                durationMinutes: 240,
              }
            : { hasOverlap: false };

          const { container } = render(
            <TimelineVisualizer
              cityA={cityA}
              cityB={cityB}
              workingHoursA={workingHoursA}
              workingHoursB={workingHoursB}
              overlap={overlap}
            />
          );

          // Should always have exactly 3 timeline rows (City A, City B, Overlap)
          const timelineRows = container.querySelectorAll('.timeline-row');
          expect(timelineRows.length).toBe(3);
        }
      ),
      { numRuns: 100 }
    );
  });
});
