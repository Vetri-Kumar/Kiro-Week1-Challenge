import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Integration Tests', () => {
  /**
   * Test full user flow: select cities → see suggestions
   * Requirements: 1.5, 6.3, 7.2
   */
  it('should display meeting suggestions after selecting two cities', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Verify initial state - prompt to select cities
    expect(screen.getByText(/please select both cities/i)).toBeInTheDocument();

    // Find city input fields
    const cityAInput = screen.getByLabelText(/city a/i);
    const cityBInput = screen.getByLabelText(/city b/i);

    // Type in first city
    await user.type(cityAInput, 'London');
    
    // Wait for suggestions to appear and select
    await waitFor(() => {
      const suggestions = screen.getAllByRole('option');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    // Click the first suggestion
    const firstSuggestion = screen.getAllByRole('option')[0];
    await user.click(firstSuggestion);

    // Type in second city
    await user.type(cityBInput, 'New York');
    
    // Wait for suggestions and select
    await waitFor(() => {
      const suggestions = screen.getAllByRole('option');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    const secondSuggestion = screen.getAllByRole('option')[0];
    await user.click(secondSuggestion);

    // Wait for calculations to complete and results to appear
    await waitFor(() => {
      // Should show timeline or suggestions
      expect(
        screen.queryByText(/working hours comparison/i) ||
        screen.queryByText(/meeting suggestions/i)
      ).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  /**
   * Test custom working hours flow
   * Requirements: 6.3
   */
  it('should recalculate when custom working hours are changed', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select two cities first
    const cityAInput = screen.getByLabelText(/city a/i);
    await user.type(cityAInput, 'Tokyo');
    
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]);

    const cityBInput = screen.getByLabelText(/city b/i);
    await user.type(cityBInput, 'Paris');
    
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]);

    // Wait for initial results
    await waitFor(() => {
      expect(screen.queryByText(/working hours comparison/i)).toBeInTheDocument();
    });

    // Enable custom hours
    const customHoursCheckbox = screen.getByRole('checkbox', { name: /customize working hours/i });
    await user.click(customHoursCheckbox);

    // Verify that working hours inputs are now enabled
    await waitFor(() => {
      const startTimeSelects = screen.getAllByLabelText(/start time/i);
      expect(startTimeSelects[0]).not.toBeDisabled();
    });

    // Change working hours
    const startTimeSelect = screen.getAllByLabelText(/start time/i)[0];
    await user.selectOptions(startTimeSelect, '10');

    // Results should still be displayed (recalculated)
    await waitFor(() => {
      expect(screen.queryByText(/working hours comparison/i)).toBeInTheDocument();
    });
  });

  /**
   * Test date change flow
   * Requirements: 7.2
   */
  it('should recalculate when date is changed', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select two cities
    const cityAInput = screen.getByLabelText(/city a/i);
    await user.type(cityAInput, 'Sydney');
    
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]);

    const cityBInput = screen.getByLabelText(/city b/i);
    await user.type(cityBInput, 'Berlin');
    
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]);

    // Wait for initial results
    await waitFor(() => {
      expect(screen.queryByText(/working hours comparison/i)).toBeInTheDocument();
    });

    // Change date to tomorrow
    const tomorrowButton = screen.getByRole('button', { name: /tomorrow/i });
    await user.click(tomorrowButton);

    // Verify date changed
    await waitFor(() => {
      expect(tomorrowButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Results should still be displayed (recalculated)
    expect(screen.queryByText(/working hours comparison/i)).toBeInTheDocument();
  });

  /**
   * Test error handling flow
   * Requirements: 1.5
   */
  it('should handle invalid city input gracefully', async () => {
    const user = userEvent.setup();
    render(<App />);

    const cityAInput = screen.getByLabelText(/city a/i);
    
    // Type an invalid city name
    await user.type(cityAInput, 'InvalidCityXYZ123');
    
    // Blur the input to trigger validation
    await user.tab();

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/city not found/i)).toBeInTheDocument();
    });

    // Prompt message should still be visible
    expect(screen.getByText(/please select both cities/i)).toBeInTheDocument();
  });

  /**
   * Test that app renders without crashing
   */
  it('should render the app header and initial UI', () => {
    render(<App />);
    
    // Check for main heading
    expect(screen.getByRole('heading', { name: /time zone overlap finder/i })).toBeInTheDocument();
    
    // Check for city input fields
    expect(screen.getByLabelText(/city a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city b/i)).toBeInTheDocument();
    
    // Check for date selector
    expect(screen.getByText(/select date/i)).toBeInTheDocument();
    
    // Check for prompt message
    expect(screen.getByText(/please select both cities/i)).toBeInTheDocument();
  });
});
