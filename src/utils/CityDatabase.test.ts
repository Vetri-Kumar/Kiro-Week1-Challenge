import { describe, it, expect, beforeEach } from 'vitest';
import { CityDatabase } from './CityDatabase';
import type { City } from '../types';

describe('CityDatabase - Unit Tests', () => {
  let db: CityDatabase;

  beforeEach(() => {
    db = new CityDatabase();
  });

  describe('searchCities', () => {
    it('should return exact match for city name', () => {
      const results = db.searchCities('London');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('London');
      expect(results[0].country).toBe('United Kingdom');
      expect(results[0].timezone).toBe('Europe/London');
    });

    it('should return results for partial city name match', () => {
      const results = db.searchCities('New');
      
      expect(results.length).toBeGreaterThan(0);
      const hasNewYork = results.some(city => city.name === 'New York');
      expect(hasNewYork).toBe(true);
    });

    it('should return empty array for empty query', () => {
      const results = db.searchCities('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = db.searchCities('   ');
      expect(results).toEqual([]);
    });

    it('should handle special characters in search query', () => {
      const results = db.searchCities('São Paulo');
      
      expect(results.length).toBeGreaterThan(0);
      const hasSaoPaulo = results.some(city => city.name === 'São Paulo');
      expect(hasSaoPaulo).toBe(true);
    });

    it('should normalize accents and diacritics', () => {
      // Search without accent should find city with accent
      const results = db.searchCities('Sao Paulo');
      
      expect(results.length).toBeGreaterThan(0);
      const hasSaoPaulo = results.some(city => city.name === 'São Paulo');
      expect(hasSaoPaulo).toBe(true);
    });

    it('should be case-insensitive', () => {
      const resultsLower = db.searchCities('london');
      const resultsUpper = db.searchCities('LONDON');
      const resultsMixed = db.searchCities('LoNdOn');
      
      expect(resultsLower.length).toBeGreaterThan(0);
      expect(resultsUpper.length).toBeGreaterThan(0);
      expect(resultsMixed.length).toBeGreaterThan(0);
      
      expect(resultsLower[0].name).toBe('London');
      expect(resultsUpper[0].name).toBe('London');
      expect(resultsMixed[0].name).toBe('London');
    });

    it('should search by country name', () => {
      const results = db.searchCities('Japan');
      
      expect(results.length).toBeGreaterThan(0);
      const hasTokyo = results.some(city => city.country === 'Japan');
      expect(hasTokyo).toBe(true);
    });

    it('should respect the limit parameter', () => {
      const results = db.searchCities('a', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for query with only special characters', () => {
      const results = db.searchCities('!!!');
      expect(results).toEqual([]);
    });

    it('should handle queries with numbers', () => {
      const results = db.searchCities('123');
      // Should return empty or valid results, but not crash
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getCityByName', () => {
    it('should return city for exact name match', () => {
      const city = db.getCityByName('London');
      
      expect(city).not.toBeNull();
      expect(city?.name).toBe('London');
      expect(city?.country).toBe('United Kingdom');
      expect(city?.timezone).toBe('Europe/London');
    });

    it('should be case-insensitive', () => {
      const city = db.getCityByName('london');
      
      expect(city).not.toBeNull();
      expect(city?.name).toBe('London');
    });

    it('should return null for non-existent city', () => {
      const city = db.getCityByName('NonExistentCity');
      expect(city).toBeNull();
    });

    it('should handle cities with accents', () => {
      const city = db.getCityByName('São Paulo');
      
      expect(city).not.toBeNull();
      expect(city?.name).toBe('São Paulo');
    });

    it('should normalize accents when searching', () => {
      const city = db.getCityByName('Sao Paulo');
      
      expect(city).not.toBeNull();
      expect(city?.name).toBe('São Paulo');
    });
  });

  describe('getAllCities', () => {
    it('should return all cities in the database', () => {
      const cities = db.getAllCities();
      
      expect(Array.isArray(cities)).toBe(true);
      expect(cities.length).toBeGreaterThan(0);
    });

    it('should return a copy of the cities array', () => {
      const cities1 = db.getAllCities();
      const cities2 = db.getAllCities();
      
      // Should be different array instances
      expect(cities1).not.toBe(cities2);
      // But with the same content
      expect(cities1).toEqual(cities2);
    });

    it('should return cities with all required properties', () => {
      const cities = db.getAllCities();
      
      for (const city of cities) {
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('country');
        expect(city).toHaveProperty('timezone');
        expect(typeof city.name).toBe('string');
        expect(typeof city.country).toBe('string');
        expect(typeof city.timezone).toBe('string');
      }
    });
  });

  describe('custom city database', () => {
    it('should allow initialization with custom cities', () => {
      const customCities: City[] = [
        {
          name: 'TestCity',
          country: 'TestCountry',
          timezone: 'America/New_York'
        }
      ];
      
      const customDb = new CityDatabase(customCities);
      const results = customDb.searchCities('TestCity');
      
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('TestCity');
    });
  });
});

  describe('Error handling and graceful degradation', () => {
    it('should handle empty city array gracefully', () => {
      const emptyDb = new CityDatabase([]);
      
      expect(emptyDb.isLoaded()).toBe(false);
      expect(emptyDb.searchCities('London')).toEqual([]);
      expect(emptyDb.getCityByName('London')).toBeNull();
      expect(emptyDb.getAllCities()).toEqual([]);
    });

    it('should filter out invalid city entries', () => {
      const invalidCities = [
        { name: 'Valid', country: 'Country', timezone: 'UTC' },
        { name: '', country: 'Country', timezone: 'UTC' }, // Invalid: empty name
        { name: 'Invalid', country: 'Country', timezone: '' }, // Invalid: empty timezone
        { name: 'Valid2', country: 'Country2', timezone: 'America/New_York' },
      ] as City[];
      
      const db = new CityDatabase(invalidCities);
      const allCities = db.getAllCities();
      
      expect(allCities.length).toBe(2); // Only 2 valid cities
      expect(allCities.every(c => c.name && c.timezone)).toBe(true);
    });

    it('should check if database is loaded', () => {
      const loadedDb = new CityDatabase();
      expect(loadedDb.isLoaded()).toBe(true);
      
      const emptyDb = new CityDatabase([]);
      expect(emptyDb.isLoaded()).toBe(false);
    });

    it('should handle null or undefined in city data gracefully', () => {
      const citiesWithNull = [
        { name: 'Valid', country: 'Country', timezone: 'UTC' },
        null,
        undefined,
        { name: 'Valid2', country: 'Country2', timezone: 'America/New_York' },
      ] as unknown as City[];
      
      const db = new CityDatabase(citiesWithNull);
      const allCities = db.getAllCities();
      
      // Should filter out null/undefined entries
      expect(allCities.length).toBe(2);
      expect(allCities.every(c => c !== null && c !== undefined)).toBe(true);
    });
  });
