import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateSelector } from './DateSelector';

describe('DateSelector Component', () => {
  it('selects today by default', () => {
    const handleDateChange = vi.fn();
    render(<DateSelector onDateChange={handleDateChange} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    expect(todayButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onDateChange with today when today is selected', async () => {
    const user = userEvent.setup();
    const handleDateChange = vi.fn();
    render(<DateSelector onDateChange={handleDateChange} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    await user.click(todayButton);

    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0] as Date;
    const today = new Date();
    
    // Compare dates (ignore time)
    expect(calledDate.getFullYear()).toBe(today.getFullYear());
    expect(calledDate.getMonth()).toBe(today.getMonth());
    expect(calledDate.getDate()).toBe(today.getDate());
  });

  it('calls onDateChange with tomorrow when tomorrow is selected', async () => {
    const user = userEvent.setup();
    const handleDateChange = vi.fn();
    
    // Calculate tomorrow before rendering to avoid timing issues
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    render(<DateSelector onDateChange={handleDateChange} />);

    const tomorrowButton = screen.getByRole('button', { name: /tomorrow/i });
    
    // Clear the initial call from useEffect
    handleDateChange.mockClear();
    
    await user.click(tomorrowButton);

    expect(handleDateChange).toHaveBeenCalled();
    const calledDate = handleDateChange.mock.calls[0][0] as Date;
    
    // Compare dates (ignore time)
    expect(calledDate.getFullYear()).toBe(tomorrow.getFullYear());
    expect(calledDate.getMonth()).toBe(tomorrow.getMonth());
    expect(calledDate.getDate()).toBe(tomorrow.getDate());
  });

  it('displays selected date in readable format', () => {
    const handleDateChange = vi.fn();
    const today = new Date();
    render(<DateSelector onDateChange={handleDateChange} selectedDate={today} />);

    // Should display the date in a readable format
    const dateDisplay = screen.getByText(/selected date/i);
    expect(dateDisplay).toBeInTheDocument();
  });

  it('updates button states when tomorrow is selected', async () => {
    const user = userEvent.setup();
    const handleDateChange = vi.fn();
    render(<DateSelector onDateChange={handleDateChange} />);

    const todayButton = screen.getByRole('button', { name: /today/i });
    const tomorrowButton = screen.getByRole('button', { name: /tomorrow/i });

    // Initially today is selected
    expect(todayButton).toHaveAttribute('aria-pressed', 'true');
    expect(tomorrowButton).toHaveAttribute('aria-pressed', 'false');

    // Click tomorrow
    await user.click(tomorrowButton);

    // Now tomorrow should be selected
    expect(todayButton).toHaveAttribute('aria-pressed', 'false');
    expect(tomorrowButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays formatted date for today', () => {
    const handleDateChange = vi.fn();
    const today = new Date();
    render(<DateSelector onDateChange={handleDateChange} selectedDate={today} />);

    // Check that date is displayed in a readable format
    const expectedFormat = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    expect(screen.getByText(expectedFormat)).toBeInTheDocument();
  });

  it('displays formatted date for tomorrow', async () => {
    const user = userEvent.setup();
    const handleDateChange = vi.fn();
    render(<DateSelector onDateChange={handleDateChange} />);

    const tomorrowButton = screen.getByRole('button', { name: /tomorrow/i });
    await user.click(tomorrowButton);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const expectedFormat = tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    expect(screen.getByText(expectedFormat)).toBeInTheDocument();
  });
});
