import type { City } from '../types';
import citiesData from '../data/cities.json';

export class CityDatabase {
  private cities: City[];

  constructor(cities?: City[]) {
    try {
      this.cities = cities || (citiesData as City[]);
      
      // Validate that we have valid city data
      if (!Array.isArray(this.cities) || this.cities.length === 0) {
        console.warn('City database is empty or invalid, using empty array');
        this.cities = [];
      }

      // Filter out any invalid city entries
      this.cities = this.cities.filter(city => 
        city && 
        typeof city.name === 'string' && 
        city.name.trim() !== '' &&
        typeof city.country === 'string' &&
        typeof city.timezone === 'string' &&
        city.timezone.trim() !== ''
      );
    } catch (error) {
      console.error('Failed to load city database:', error);
      this.cities = [];
    }
  }

  /**
   * Check if the database has been loaded successfully
   * @returns true if database contains cities, false otherwise
   */
  isLoaded(): boolean {
    return this.cities.length > 0;
  }

  /**
   * Search for cities matching the query string
   * Uses fuzzy matching to find cities by name or country
   * @param query - Search string
   * @param limit - Maximum number of results to return (default: 10)
   * @returns Array of matching cities
   */
  searchCities(query: string, limit: number = 10): City[] {
    if (!query || query.trim() === '') {
      return [];
    }

    const normalizedQuery = this.normalizeString(query);
    
    // After normalization, check if query is still valid
    if (normalizedQuery === '') {
      return [];
    }
    
    const queryWords = normalizedQuery.split(/\s+/);

    // Score each city based on how well it matches the query
    const scoredCities = this.cities.map(city => ({
      city,
      score: this.calculateMatchScore(city, normalizedQuery, queryWords)
    }));

    // Filter out cities with no meaningful match (minimum score threshold of 25)
    // and sort by score
    const MIN_SCORE_THRESHOLD = 25;
    return scoredCities
      .filter(item => item.score >= MIN_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.city);
  }

  /**
   * Get a city by exact name match
   * @param name - City name to look up
   * @returns City object or null if not found
   */
  getCityByName(name: string): City | null {
    const normalizedName = this.normalizeString(name);
    const city = this.cities.find(
      c => this.normalizeString(c.name) === normalizedName
    );
    return city || null;
  }

  /**
   * Get all cities in the database
   * @returns Array of all cities
   */
  getAllCities(): City[] {
    return [...this.cities];
  }

  /**
   * Normalize a string for comparison (lowercase, remove accents, remove special chars, trim)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters, keep only letters, numbers, and spaces
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  }

  /**
   * Calculate a match score for a city based on the query
   * Higher scores indicate better matches
   */
  private calculateMatchScore(city: City, normalizedQuery: string, queryWords: string[]): number {
    const normalizedCityName = this.normalizeString(city.name);
    const normalizedCountry = this.normalizeString(city.country);

    let score = 0;

    // Exact match gets highest score
    if (normalizedCityName === normalizedQuery) {
      score += 1000;
    }
    // Starts with query gets high score
    else if (normalizedCityName.startsWith(normalizedQuery)) {
      score += 500;
    }
    // Contains query gets medium score
    else if (normalizedCityName.includes(normalizedQuery)) {
      score += 250;
    }

    // Check country match
    if (normalizedCountry === normalizedQuery) {
      score += 100;
    } else if (normalizedCountry.startsWith(normalizedQuery)) {
      score += 50;
    } else if (normalizedCountry.includes(normalizedQuery)) {
      score += 25;
    }

    // Check individual word matches (for multi-word queries)
    for (const word of queryWords) {
      if (word.length < 2) continue; // Skip very short words

      if (normalizedCityName.includes(word)) {
        score += 50;
      }
      if (normalizedCountry.includes(word)) {
        score += 25;
      }
    }

    // Fuzzy matching: check for character-by-character similarity
    if (score === 0) {
      const fuzzyScore = this.fuzzyMatch(normalizedCityName, normalizedQuery);
      if (fuzzyScore > 0.6) {
        score += Math.floor(fuzzyScore * 100);
      }
    }

    return score;
  }

  /**
   * Calculate fuzzy match score between two strings
   * Returns a value between 0 and 1, where 1 is a perfect match
   */
  private fuzzyMatch(str: string, pattern: string): number {
    if (pattern.length === 0) return 0;
    if (str.length === 0) return 0;

    let patternIdx = 0;
    let strIdx = 0;
    let matches = 0;

    while (strIdx < str.length && patternIdx < pattern.length) {
      if (str[strIdx] === pattern[patternIdx]) {
        matches++;
        patternIdx++;
      }
      strIdx++;
    }

    // Return ratio of matched characters to pattern length
    return matches / pattern.length;
  }
}
