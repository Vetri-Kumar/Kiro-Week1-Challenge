import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkingHoursInput } from './WorkingHoursInput';
import type { WorkingHours } from '../types';

describe('WorkingHoursInput Component', () => {
  const defaultHours: WorkingHours = { start: 9, end: 18 };

  it('displays default hours (9 AM - 6 PM)', () => {
    const handleChange = vi.fn();
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
      />
    );

    // Check that the start time shows 9 (9 AM)
    const startInput = screen.getByLabelText(/start time/i) as HTMLSelectElement;
    expect(startInput.value).toBe('9');

    // Check that the end time shows 18 (6 PM)
    const endInput = screen.getByLabelText(/end time/i) as HTMLSelectElement;
    expect(endInput.value).toBe('18');
  });

  it('displays validation error when end time is before start time', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { container } = render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
      />
    );

    // Change start time to 18 (6 PM)
    const startInput = screen.getByLabelText(/start time/i);
    await user.selectOptions(startInput, '18');

    // End time is still 18, so start >= end (invalid)
    // Wait for validation error to appear
    const errorMessage = container.querySelector('[role="alert"]');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage?.textContent).toMatch(/end time must be after start time/i);
  });

  it('supports custom hours toggle', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const handleToggle = vi.fn();
    
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
        customEnabled={false}
        onToggleCustom={handleToggle}
      />
    );

    // Find the toggle checkbox or button
    const toggle = screen.getByRole('checkbox', { name: /custom hours/i });
    expect(toggle).toBeInTheDocument();

    // Click to enable custom hours
    await user.click(toggle);

    // Callback should be called
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it('calls onChange when valid hours are selected', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
      />
    );

    // Change start time to 8
    const startInput = screen.getByLabelText(/start time/i);
    await user.selectOptions(startInput, '8');

    // Should call onChange with new valid hours
    expect(handleChange).toHaveBeenCalledWith({ start: 8, end: 18 });
  });

  it('does not call onChange when hours become invalid', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
      />
    );

    // Clear previous calls
    handleChange.mockClear();

    // Change end time to 9 (same as start)
    const endInput = screen.getByLabelText(/end time/i);
    await user.selectOptions(endInput, '9');

    // Should NOT call onChange because hours are invalid (start >= end)
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('disables inputs when customEnabled is false', () => {
    const handleChange = vi.fn();
    
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
        customEnabled={false}
      />
    );

    const startInput = screen.getByLabelText(/start time/i) as HTMLSelectElement;
    const endInput = screen.getByLabelText(/end time/i) as HTMLSelectElement;

    expect(startInput.disabled).toBe(true);
    expect(endInput.disabled).toBe(true);
  });

  it('enables inputs when customEnabled is true', () => {
    const handleChange = vi.fn();
    
    render(
      <WorkingHoursInput
        label="City A Working Hours"
        workingHours={defaultHours}
        onChange={handleChange}
        customEnabled={true}
      />
    );

    const startInput = screen.getByLabelText(/start time/i) as HTMLSelectElement;
    const endInput = screen.getByLabelText(/end time/i) as HTMLSelectElement;

    expect(startInput.disabled).toBe(false);
    expect(endInput.disabled).toBe(false);
  });
});
