import { useState, useEffect, useMemo, useCallback } from 'react';
import type { City, WorkingHours, AppState } from './types';
import { CityInput } from './components/CityInput';
import { WorkingHoursInput } from './components/WorkingHoursInput';
import { DateSelector } from './components/DateSelector';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { MeetingSuggestions } from './components/MeetingSuggestions';
import { OverlapCalculator } from './calculators/OverlapCalculator';
import { MeetingSuggester } from './calculators/MeetingSuggester';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

function AppContent() {
  // Initialize state with default values
  const [state, setState] = useState<AppState>({
    cityA: null,
    cityB: null,
    workingHoursA: { start: 9, end: 18 },
    workingHoursB: { start: 9, end: 18 },
    selectedDate: new Date(),
    customHoursEnabled: false,
    overlap: null,
    suggestions: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize calculator instances to prevent recreation on every render
  const overlapCalculator = useMemo(() => new OverlapCalculator(), []);
  const meetingSuggester = useMemo(() => new MeetingSuggester(), []);

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleCityASelect = useCallback((city: City | null) => {
    setState(prev => ({ ...prev, cityA: city }));
    setError(null);
  }, []);

  const handleCityBSelect = useCallback((city: City | null) => {
    setState(prev => ({ ...prev, cityB: city }));
    setError(null);
  }, []);

  const handleWorkingHoursAChange = useCallback((hours: WorkingHours) => {
    setState(prev => ({ ...prev, workingHoursA: hours }));
    setError(null);
  }, []);

  const handleWorkingHoursBChange = useCallback((hours: WorkingHours) => {
    setState(prev => ({ ...prev, workingHoursB: hours }));
    setError(null);
  }, []);

  const handleCustomHoursToggle = useCallback((enabled: boolean) => {
    setState(prev => ({ 
      ...prev, 
      customHoursEnabled: enabled,
      // Reset to default hours when disabling custom hours
      workingHoursA: enabled ? prev.workingHoursA : { start: 9, end: 18 },
      workingHoursB: enabled ? prev.workingHoursB : { start: 9, end: 18 }
    }));
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  // Memoize validation function
  const validateWorkingHours = useCallback((hours: WorkingHours): boolean => {
    return hours.end > hours.start;
  }, []);

  // Calculate overlap and generate suggestions
  useEffect(() => {
    // Only calculate if both cities are selected
    if (!state.cityA || !state.cityB) {
      setState(prev => ({ ...prev, overlap: null, suggestions: [] }));
      return;
    }

    // Validate working hours
    if (!validateWorkingHours(state.workingHoursA)) {
      setError('Invalid working hours for City A: End time must be after start time');
      setState(prev => ({ ...prev, overlap: null, suggestions: [] }));
      return;
    }

    if (!validateWorkingHours(state.workingHoursB)) {
      setError('Invalid working hours for City B: End time must be after start time');
      setState(prev => ({ ...prev, overlap: null, suggestions: [] }));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate overlap
      const overlapResult = overlapCalculator.calculateOverlap(
        state.cityA,
        state.cityB,
        state.workingHoursA,
        state.workingHoursB,
        state.selectedDate
      );

      // Generate suggestions from overlap
      const suggestions = overlapResult.hasOverlap
        ? meetingSuggester.generateSuggestions(
            overlapResult,
            state.cityA,
            state.cityB,
            state.workingHoursA,
            state.workingHoursB
          )
        : [];

      setState(prev => ({
        ...prev,
        overlap: overlapResult,
        suggestions
      }));
    } catch (err) {
      // Extract meaningful error message
      let errorMessage = 'An error occurred while calculating overlap. Please try again.';
      
      if (err instanceof Error) {
        // Use the error message if it's user-friendly
        if (err.message.includes('timezone') || 
            err.message.includes('Unable to determine') ||
            err.message.includes('Invalid')) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Overlap calculation error:', err);
      setState(prev => ({ ...prev, overlap: null, suggestions: [] }));
    } finally {
      setLoading(false);
    }
  }, [
    state.cityA,
    state.cityB,
    state.workingHoursA,
    state.workingHoursB,
    state.selectedDate
  ]);

  // Memoize calculations enabled check
  const calculationsEnabled = useMemo(
    () => state.cityA !== null && state.cityB !== null,
    [state.cityA, state.cityB]
  );

  return (
    <div className="app">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>
      <header className="app-header" role="banner">
        <h1>Time Zone Overlap Finder</h1>
        <p>Find the best meeting times between two cities</p>
      </header>

      <main id="main-content" className="app-main" role="main">
        {/* City Selection */}
        <section className="input-section" aria-labelledby="city-selection-heading">
          <h2 id="city-selection-heading" className="visually-hidden">City Selection</h2>
          <div className="city-inputs">
            <CityInput
              label="City A"
              onCitySelect={handleCityASelect}
              placeholder="Search for first city..."
              value={state.cityA}
            />
            <CityInput
              label="City B"
              onCitySelect={handleCityBSelect}
              placeholder="Search for second city..."
              value={state.cityB}
            />
          </div>
        </section>

        {/* Date Selection */}
        <section className="input-section" aria-labelledby="date-selection-heading">
          <h2 id="date-selection-heading" className="visually-hidden">Date Selection</h2>
          <DateSelector
            onDateChange={handleDateChange}
            selectedDate={state.selectedDate}
          />
        </section>

        {/* Working Hours Configuration */}
        {calculationsEnabled && (
          <section className="input-section" aria-labelledby="working-hours-heading">
            <h2 id="working-hours-heading" className="visually-hidden">Working Hours Configuration</h2>
            <div className="working-hours-toggle-container">
              <label htmlFor="customize-working-hours-toggle">
                <input
                  id="customize-working-hours-toggle"
                  type="checkbox"
                  checked={state.customHoursEnabled}
                  onChange={(e) => handleCustomHoursToggle(e.target.checked)}
                  aria-label="Customize working hours for both cities"
                />
                <span>Customize working hours</span>
              </label>
            </div>
            <div className="working-hours-inputs">
              <WorkingHoursInput
                label={state.cityA?.name || 'City A'}
                workingHours={state.workingHoursA}
                onChange={handleWorkingHoursAChange}
                customEnabled={state.customHoursEnabled}
              />
              <WorkingHoursInput
                label={state.cityB?.name || 'City B'}
                workingHours={state.workingHoursB}
                onChange={handleWorkingHoursBChange}
                customEnabled={state.customHoursEnabled}
              />
            </div>
          </section>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-message" role="status" aria-live="polite">
            <div className="loading-spinner" aria-hidden="true"></div>
            <span>Calculating overlap...</span>
          </div>
        )}

        {/* Results Display */}
        {calculationsEnabled && !loading && state.overlap && (
          <>
            {/* Timeline Visualization */}
            <ErrorBoundary fallback={
              <div className="error-message" role="alert">
                Unable to display timeline. Please try refreshing the page.
              </div>
            }>
              <section className="results-section" aria-labelledby="timeline-heading">
                <h2 id="timeline-heading" className="visually-hidden">Working Hours Timeline</h2>
                <TimelineVisualizer
                  cityA={state.cityA!}
                  cityB={state.cityB!}
                  workingHoursA={state.workingHoursA}
                  workingHoursB={state.workingHoursB}
                  overlap={state.overlap}
                />
              </section>
            </ErrorBoundary>

            {/* Meeting Suggestions */}
            <ErrorBoundary fallback={
              <div className="error-message" role="alert">
                Unable to display meeting suggestions. Please try refreshing the page.
              </div>
            }>
              <section className="results-section" aria-labelledby="suggestions-heading">
                <h2 id="suggestions-heading" className="visually-hidden">Meeting Time Suggestions</h2>
                <MeetingSuggestions
                  suggestions={state.suggestions}
                  cityA={state.cityA!}
                  cityB={state.cityB!}
                  overlapDurationMinutes={state.overlap.durationMinutes || 0}
                />
              </section>
            </ErrorBoundary>
          </>
        )}

        {/* Prompt to select cities */}
        {!calculationsEnabled && (
          <div className="prompt-message" role="status" aria-live="polite">
            Please select both cities to see meeting time suggestions.
          </div>
        )}
      </main>
    </div>
  );
}

// Wrap the app with ErrorBoundary
function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
