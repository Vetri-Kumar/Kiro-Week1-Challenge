import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CityDatabase } from './CityDatabase';

describe('CityDatabase - Property-Based Tests', () => {
  // Feature: timezone-overlap-finder, Property 1: City search returns valid database entries
  // Validates: Requirements 1.2
  it('Property 1: City search returns valid database entries', () => {
    const db = new CityDatabase();
    const allCities = db.getAllCities();

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (query) => {
          const results = db.searchCities(query);

          // Property: All results must be valid cities from the database
          for (const result of results) {
            const isValidCity = allCities.some(
              city =>
                city.name === result.name &&
                city.country === result.country &&
                city.timezone === result.timezone
            );
            expect(isValidCity).toBe(true);
          }

          // Property: All results must have valid IANA timezone identifiers
          for (const result of results) {
            expect(result.timezone).toBeTruthy();
            expect(typeof result.timezone).toBe('string');
            expect(result.timezone.length).toBeGreaterThan(0);
            // IANA timezone format: Area/Location or Area/Location/Sublocation
            expect(result.timezone).toMatch(/^[A-Za-z_]+\/[A-Za-z_]+/);
          }

          // Property: Results should not exceed the limit (default 10)
          expect(results.length).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
