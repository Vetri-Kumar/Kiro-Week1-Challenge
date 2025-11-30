import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { City } from '../types';
import { CityDatabase } from '../utils/CityDatabase';
import './CityInput.css';

interface CityInputProps {
  label: string;
  onCitySelect: (city: City | null) => void;
  placeholder?: string;
  value?: City | null;
}

export const CityInput: React.FC<CityInputProps> = ({
  label,
  onCitySelect,
  placeholder = 'Search for a city...',
  value = null,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityDatabase = useRef(new CityDatabase());
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  // Check if database loaded successfully
  useEffect(() => {
    if (!cityDatabase.current.isLoaded()) {
      setDatabaseError('Unable to load city data. Please refresh the page.');
    }
  }, []);

  // Update input value when external value changes
  useEffect(() => {
    if (value) {
      setInputValue(value.name);
      setError(null);
    } else {
      setInputValue('');
    }
  }, [value]);

  // Debounced search function
  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    // Check if database is loaded
    if (!cityDatabase.current.isLoaded()) {
      setError('City database not available. Please refresh the page.');
      return;
    }

    try {
      const results = cityDatabase.current.searchCities(query, 10);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      performSearch(value);
    }, 300);

    setDebounceTimer(timer);
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setInputValue(city.name);
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
    setSelectedIndex(-1);
    onCitySelect(city);
  };

  // Handle input blur - validate city
  const handleBlur = () => {
    // Delay to allow click on dropdown
    setTimeout(() => {
      if (inputValue.trim() && !value) {
        const exactMatch = cityDatabase.current.getCityByName(inputValue);
        if (exactMatch) {
          handleCitySelect(exactMatch);
        } else {
          setError('City not found. Please select from suggestions.');
          onCitySelect(null);
        }
      }
      setShowDropdown(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCitySelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement && selectedElement.scrollIntoView) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="city-input-container" role="group" aria-labelledby={`city-input-label-${label}`}>
      <label id={`city-input-label-${label}`} htmlFor={`city-input-${label}`} className="city-input-label">
        {label}
      </label>
      <div className="city-input-wrapper">
        <input
          ref={inputRef}
          id={`city-input-${label}`}
          type="text"
          className={`city-input ${error ? 'city-input-error' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={`Search for ${label}`}
          aria-autocomplete="list"
          aria-controls={showDropdown ? `city-dropdown-${label}` : undefined}
          aria-expanded={showDropdown}
          aria-activedescendant={
            selectedIndex >= 0 ? `city-option-${label}-${selectedIndex}` : undefined
          }
          aria-describedby={error ? `city-error-${label}` : undefined}
          aria-invalid={error ? 'true' : 'false'}
        />
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            id={`city-dropdown-${label}`}
            className="city-dropdown"
            role="listbox"
            aria-label={`${label} suggestions`}
          >
            {suggestions.map((city, index) => (
              <div
                key={`${city.name}-${city.country}`}
                id={`city-option-${label}-${index}`}
                className={`city-option ${index === selectedIndex ? 'city-option-selected' : ''}`}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  handleCitySelect(city);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="city-name">{city.name}</span>
                <span className="city-country">{city.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <div id={`city-error-${label}`} className="city-input-error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      {databaseError && (
        <div className="city-input-error-message" role="alert" aria-live="assertive">
          {databaseError}
        </div>
      )}
    </div>
  );
};
