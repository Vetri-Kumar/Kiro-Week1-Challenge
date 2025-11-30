import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CityInput } from './CityInput';
import type { City } from '../types';

describe('CityInput Component', () => {
  const mockCity: City = {
    name: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
  };

  it('renders with correct label', () => {
    const handleCitySelect = vi.fn();
    render(<CityInput label="City A" onCitySelect={handleCitySelect} />);
    
    expect(screen.getByLabelText('City A')).toBeInTheDocument();
  });

  it('displays dropdown on typing', async () => {
    const user = userEvent.setup();
    const handleCitySelect = vi.fn();
    const { container } = render(
      <CityInput label="City A" onCitySelect={handleCitySelect} />
    );
    
    const input = screen.getByLabelText('City A');
    await user.type(input, 'Lon');
    
    // Wait for debounce
    await waitFor(() => {
      const dropdown = container.querySelector('.city-dropdown');
      expect(dropdown).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('selection clears dropdown', async () => {
    const user = userEvent.setup();
    const handleCitySelect = vi.fn();
    const { container } = render(
      <CityInput label="City A" onCitySelect={handleCitySelect} />
    );
    
    const input = screen.getByLabelText('City A');
    await user.type(input, 'London');
    
    // Wait for dropdown to appear
    await waitFor(() => {
      expect(container.querySelector('.city-dropdown')).toBeInTheDocument();
    }, { timeout: 500 });
    
    // Click on the first city option
    const cityOption = container.querySelector('.city-option');
    expect(cityOption).toBeInTheDocument();
    await user.click(cityOption!);
    
    // Dropdown should be cleared
    await waitFor(() => {
      expect(container.querySelector('.city-dropdown')).not.toBeInTheDocument();
    });
    
    // Callback should be called
    expect(handleCitySelect).toHaveBeenCalled();
  });

  it('supports keyboard navigation through suggestions', async () => {
    const user = userEvent.setup();
    const handleCitySelect = vi.fn();
    const { container } = render(
      <CityInput label="City A" onCitySelect={handleCitySelect} />
    );
    
    const input = screen.getByLabelText('City A') as HTMLInputElement;
    await user.type(input, 'New');
    
    // Wait for dropdown
    await waitFor(() => {
      expect(container.querySelector('.city-dropdown')).toBeInTheDocument();
    }, { timeout: 500 });
    
    // Press arrow down to select first item
    await user.keyboard('{ArrowDown}');
    
    // Check that first option is selected
    await waitFor(() => {
      const selectedOption = container.querySelector('.city-option-selected');
      expect(selectedOption).toBeInTheDocument();
    });
    
    // Press Enter to select
    await user.keyboard('{Enter}');
    
    // Callback should be called
    await waitFor(() => {
      expect(handleCitySelect).toHaveBeenCalled();
    });
  });

  it('displays error for invalid city on blur', async () => {
    const user = userEvent.setup();
    const handleCitySelect = vi.fn();
    const { container } = render(
      <CityInput label="City A" onCitySelect={handleCitySelect} />
    );
    
    const input = screen.getByLabelText('City A');
    await user.type(input, 'InvalidCityXYZ123');
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Blur the input
    await user.click(document.body);
    
    // Wait for error message
    await waitFor(() => {
      const errorMessage = container.querySelector('[role="alert"]');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage?.textContent).toContain('City not found');
    }, { timeout: 500 });
  });

  it('populates input with value prop', () => {
    const handleCitySelect = vi.fn();
    render(
      <CityInput
        label="City A"
        onCitySelect={handleCitySelect}
        value={mockCity}
      />
    );
    
    const input = screen.getByLabelText('City A') as HTMLInputElement;
    expect(input.value).toBe('London');
  });

  it('clears input when value prop is null', () => {
    const handleCitySelect = vi.fn();
    const { rerender } = render(
      <CityInput
        label="City A"
        onCitySelect={handleCitySelect}
        value={mockCity}
      />
    );
    
    const input = screen.getByLabelText('City A') as HTMLInputElement;
    expect(input.value).toBe('London');
    
    // Update to null
    rerender(
      <CityInput
        label="City A"
        onCitySelect={handleCitySelect}
        value={null}
      />
    );
    
    expect(input.value).toBe('');
  });

  it('handles Escape key to close dropdown', async () => {
    const user = userEvent.setup();
    const handleCitySelect = vi.fn();
    const { container } = render(
      <CityInput label="City A" onCitySelect={handleCitySelect} />
    );
    
    const input = screen.getByLabelText('City A');
    await user.type(input, 'Paris');
    
    // Wait for dropdown
    await waitFor(() => {
      expect(container.querySelector('.city-dropdown')).toBeInTheDocument();
    }, { timeout: 500 });
    
    // Press Escape
    await user.keyboard('{Escape}');
    
    // Dropdown should be closed
    await waitFor(() => {
      expect(container.querySelector('.city-dropdown')).not.toBeInTheDocument();
    });
  });
});
