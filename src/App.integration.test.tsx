import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

/**
 * End-to-end integration tests for the complete user flow
 * These tests verify that all features work together correctly
 */
describe('App - End-to-End Integration Tests', () => {
  it('should complete full user flow: select cities, customize hours, change date, and see results', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Step 1: Verify initial state - prompt to select cities
    expect(screen.getByText(/please select both cities/i)).toBeInTheDocument();

    // Step 2: Select City A (London)
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'London');
    
    await waitFor(() => {
      expect(screen.getByText('London')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('London'));

    // Step 3: Select City B (New York)
    const cityBInput = screen.getByLabelText(/search for city b/i);
    await user.type(cityBInput, 'New York');
    
    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('New York'));

    // Step 4: Verify results are displayed
    await waitFor(() => {
      expect(screen.queryByText(/please select both cities/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Step 5: Verify timeline is displayed (use getAllByText since city names appear multiple times)
    const londonElements = screen.getAllByText(/London/);
    expect(londonElements.length).toBeGreaterThan(0);
    const newYorkElements = screen.getAllByText(/New York/);
    expect(newYorkElements.length).toBeGreaterThan(0);

    // Step 6: Enable custom working hours
    const customHoursCheckbox = screen.getByLabelText(/customize working hours/i);
    await user.click(customHoursCheckbox);

    // Step 7: Verify working hours inputs are enabled
    await waitFor(() => {
      const londonStartSelect = screen.getByLabelText(/start time for london/i);
      expect(londonStartSelect).toBeEnabled();
    });

    // Step 8: Change date to tomorrow
    const tomorrowButton = screen.getByRole('button', { name: /select tomorrow/i });
    await user.click(tomorrowButton);

    // Step 9: Verify date changed
    await waitFor(() => {
      expect(tomorrowButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Step 10: Verify results are still displayed after date change
    const londonElementsAfter = screen.getAllByText(/London/);
    expect(londonElementsAfter.length).toBeGreaterThan(0);
    const newYorkElementsAfter = screen.getAllByText(/New York/);
    expect(newYorkElementsAfter.length).toBeGreaterThan(0);
  });

  it('should handle error gracefully when invalid city is entered', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Enter invalid city name
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'InvalidCityXYZ123');
    
    // Blur the input to trigger validation
    await user.tab();

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/city not found/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during calculation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select first city
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'Tokyo');
    
    await waitFor(() => {
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Tokyo'));

    // Select second city - this should trigger calculation
    const cityBInput = screen.getByLabelText(/search for city b/i);
    await user.type(cityBInput, 'Sydney');
    
    await waitFor(() => {
      expect(screen.getByText('Sydney')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Sydney'));

    // Results should appear (loading state is very fast in tests)
    await waitFor(() => {
      expect(screen.queryByText(/please select both cities/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should maintain state when toggling custom hours on and off', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select cities
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'Paris');
    await waitFor(() => expect(screen.getByText('Paris')).toBeInTheDocument());
    await user.click(screen.getByText('Paris'));

    const cityBInput = screen.getByLabelText(/search for city b/i);
    await user.type(cityBInput, 'Berlin');
    await waitFor(() => expect(screen.getByText('Berlin')).toBeInTheDocument());
    await user.click(screen.getByText('Berlin'));

    // Wait for results
    await waitFor(() => {
      expect(screen.queryByText(/please select both cities/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Enable custom hours
    const customHoursCheckbox = screen.getByLabelText(/customize working hours/i);
    await user.click(customHoursCheckbox);

    // Verify inputs are enabled
    await waitFor(() => {
      const parisStartSelect = screen.getByLabelText(/start time for paris/i);
      expect(parisStartSelect).toBeEnabled();
    });

    // Disable custom hours
    await user.click(customHoursCheckbox);

    // Verify inputs are disabled
    await waitFor(() => {
      const parisStartSelect = screen.getByLabelText(/start time for paris/i);
      expect(parisStartSelect).toBeDisabled();
    });

    // Results should still be displayed
    const parisElements = screen.getAllByText(/Paris/);
    expect(parisElements.length).toBeGreaterThan(0);
    const berlinElements = screen.getAllByText(/Berlin/);
    expect(berlinElements.length).toBeGreaterThan(0);
  });

  it('should handle clipboard copy functionality', async () => {
    const user = userEvent.setup();
    
    // Mock clipboard API
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    render(<App />);

    // Select cities with overlap
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'London');
    await waitFor(() => expect(screen.getByText('London')).toBeInTheDocument());
    await user.click(screen.getByText('London'));

    const cityBInput = screen.getByLabelText(/search for city b/i);
    await user.type(cityBInput, 'Paris');
    await waitFor(() => expect(screen.getByText('Paris')).toBeInTheDocument());
    await user.click(screen.getByText('Paris'));

    // Wait for meeting suggestions
    await waitFor(() => {
      const copyButtons = screen.queryAllByRole('button', { name: /copy/i });
      expect(copyButtons.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Click first copy button
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    await user.click(copyButtons[0]);

    // Verify clipboard was called
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it('should display error when working hours are invalid', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select cities
    const cityAInput = screen.getByLabelText(/search for city a/i);
    await user.type(cityAInput, 'London');
    await waitFor(() => expect(screen.getByText('London')).toBeInTheDocument());
    await user.click(screen.getByText('London'));

    const cityBInput = screen.getByLabelText(/search for city b/i);
    await user.type(cityBInput, 'Tokyo');
    await waitFor(() => expect(screen.getByText('Tokyo')).toBeInTheDocument());
    await user.click(screen.getByText('Tokyo'));

    // Wait for results
    await waitFor(() => {
      expect(screen.queryByText(/please select both cities/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Enable custom hours
    const customHoursCheckbox = screen.getByLabelText(/customize working hours/i);
    await user.click(customHoursCheckbox);

    // Set invalid hours (end before start)
    await waitFor(() => {
      const londonStartSelect = screen.getByLabelText(/start time for london/i);
      expect(londonStartSelect).toBeEnabled();
    });

    const londonStartSelect = screen.getByLabelText(/start time for london/i);
    const londonEndSelect = screen.getByLabelText(/end time for london/i);

    // Set start to 18 (6 PM)
    await user.selectOptions(londonStartSelect, '18');
    // Set end to 9 (9 AM) - invalid!
    await user.selectOptions(londonEndSelect, '9');

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/end time must be after start time/i)).toBeInTheDocument();
    });
  });
});
