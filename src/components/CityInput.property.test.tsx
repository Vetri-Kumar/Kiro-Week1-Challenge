import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { CityInput } from './CityInput';
import { CityDatabase } from '../utils/CityDatabase';
import type { City } from '../types';

// Feature: timezone-overlap-finder, Property 2: City selection populates input correctly
// Feature: timezone-overlap-finder, Property 3: Invalid city names trigger errors
describe('CityInput Property Tests', () => {
  const cityDatabase = new CityDatabase();
  const allCities = cityDatabase.getAllCities();

  afterEach(() => {
    cleanup();
  });

  // Generator for valid cities from the database
  const cityArbitrary = fc.constantFrom(...allCities);

  it('Property 2: City selection populates input correctly', async () => {
    await fc.assert(
      fc.asyncProperty(cityArbitrary, async (city: City) => {
        const user = userEvent.setup();
        let selectedCity: City | null = null;
        const handleCitySelect = (city: City | null) => {
          selectedCity = city;
        };

        const { container, unmount } = render(
          <CityInput
            label={`City-${Date.now()}-${Math.random()}`}
            onCitySelect={handleCitySelect}
          />
        );

        const input = container.querySelector('input') as HTMLInputElement;

        // Type the city name
        await user.type(input, city.name);

        // Wait for debounce and dropdown to appear
        await waitFor(() => {
          const dropdown = container.querySelector('.city-dropdown');
          expect(dropdown).toBeInTheDocument();
        }, { timeout: 600 });

        // Find and click the matching city option in the dropdown
        const dropdown = container.querySelector('.city-dropdown');
        if (dropdown) {
          const cityOptions = dropdown.querySelectorAll('.city-option');
          const matchingOption = Array.from(cityOptions).find(
            option => option.querySelector('.city-name')?.textContent === city.name
          ) as HTMLElement;
          
          if (matchingOption) {
            await user.click(matchingOption);
            
            // Wait for state update
            await waitFor(() => {
              expect(input.value).toBe(city.name);
            }, { timeout: 200 });
          }
        }

        // Verify the input field is populated with the selected city name
        expect(input.value).toBe(city.name);

        // Verify the callback was called with the correct city
        expect(selectedCity).not.toBeNull();
        expect(selectedCity?.name).toBe(city.name);
        expect(selectedCity?.country).toBe(city.country);
        expect(selectedCity?.timezone).toBe(city.timezone);

        unmount();
        cleanup();
      }),
      { numRuns: 20, timeout: 10000 } // Reduced runs for performance
    );
  }, 15000); // Increased test timeout

  it('Property 3: Invalid city names trigger errors', async () => {
    // Generator for strings that are NOT valid city names
    const invalidCityNameArbitrary = fc.string({ minLength: 3, maxLength: 20 })
      .filter(str => {
        // Filter out strings that match any city in the database
        const normalizedStr = str.toLowerCase().trim();
        if (!normalizedStr || /^\s+$/.test(str)) return false;
        // Filter out strings with special characters that userEvent interprets as keyboard commands
        if (/[\[\]{}]/.test(str)) return false;
        return !allCities.some(city => 
          city.name.toLowerCase() === normalizedStr
        );
      });

    await fc.assert(
      fc.asyncProperty(invalidCityNameArbitrary, async (invalidName: string) => {
        const user = userEvent.setup();
        let selectedCity: City | null = null;
        const handleCitySelect = (city: City | null) => {
          selectedCity = city;
        };

        const { container, unmount } = render(
          <CityInput
            label={`City-${Date.now()}-${Math.random()}`}
            onCitySelect={handleCitySelect}
          />
        );

        const input = container.querySelector('input') as HTMLInputElement;

        // Type the invalid city name
        await user.type(input, invalidName);

        // Wait for debounce
        await new Promise(resolve => setTimeout(resolve, 350));

        // Blur the input to trigger validation
        await user.click(document.body);

        // Wait for blur handler
        await waitFor(() => {
          const errorMessage = container.querySelector('[role="alert"]');
          
          // If the invalid name happens to match a city partially and shows suggestions,
          // and user doesn't select any, it should show error
          if (input.value.trim() && !selectedCity) {
            expect(errorMessage).not.toBeNull();
            expect(errorMessage?.textContent).toContain('City not found');
          }
        }, { timeout: 400 });

        // Verify callback was called with null for invalid city
        expect(selectedCity).toBeNull();

        unmount();
        cleanup();
      }),
      { numRuns: 20, timeout: 10000 } // Reduced runs for performance
    );
  }, 15000); // Increased test timeout
});
