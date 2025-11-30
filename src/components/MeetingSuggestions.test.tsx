import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeetingSuggestions } from './MeetingSuggestions';
import { DateTime } from 'luxon';
import type { City, MeetingSuggestion } from '../types';

describe('MeetingSuggestions', () => {
  const cityA: City = {
    name: 'New York',
    country: 'USA',
    timezone: 'America/New_York',
  };

  const cityB: City = {
    name: 'London',
    country: 'UK',
    timezone: 'Europe/London',
  };

  const createSuggestion = (hourA: number, hourB: number, quality: 'Perfect Time' | 'Acceptable Time' | 'Not Recommended'): MeetingSuggestion => ({
    timeInCityA: DateTime.now().setZone(cityA.timezone).set({ hour: hourA, minute: 0, second: 0, millisecond: 0 }),
    timeInCityB: DateTime.now().setZone(cityB.timezone).set({ hour: hourB, minute: 0, second: 0, millisecond: 0 }),
    quality,
    durationMinutes: 60,
  });

  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock clipboard API
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    
    // Use vi.stubGlobal to properly mock the clipboard
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: {
        writeText: mockWriteText,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render with multiple suggestions', () => {
    const suggestions = [
      createSuggestion(10, 15, 'Perfect Time'),
      createSuggestion(14, 19, 'Acceptable Time'),
      createSuggestion(17, 22, 'Not Recommended'),
    ];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={180}
      />
    );

    // Check that all suggestions are rendered
    expect(screen.getByText(/10:00 am New York ↔ 03:00 pm London/i)).toBeInTheDocument();
    expect(screen.getByText(/02:00 pm New York ↔ 07:00 pm London/i)).toBeInTheDocument();
    expect(screen.getByText(/05:00 pm New York ↔ 10:00 pm London/i)).toBeInTheDocument();

    // Check quality indicators
    expect(screen.getByText('Perfect Time')).toBeInTheDocument();
    expect(screen.getByText('Acceptable Time')).toBeInTheDocument();
    expect(screen.getByText('Not Recommended')).toBeInTheDocument();
  });

  it('should render with no suggestions', () => {
    render(
      <MeetingSuggestions
        suggestions={[]}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={0}
      />
    );

    expect(screen.getByText(/No overlapping working hours found/i)).toBeInTheDocument();
    expect(screen.getByText(/Consider adjusting working hours or choosing different cities/i)).toBeInTheDocument();
  });

  it('should handle copy button click', async () => {
    const user = userEvent.setup();
    const suggestions = [createSuggestion(10, 15, 'Perfect Time')];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={60}
      />
    );

    const copyButton = screen.getByRole('button', { name: /Copy meeting time/i });
    expect(copyButton).toHaveTextContent('📋 Copy');
    
    await user.click(copyButton);

    // Verify the button text changes to indicate success
    expect(copyButton).toHaveTextContent('✓ Copied');
  });

  it('should display success message after successful copy', async () => {
    const user = userEvent.setup();
    const suggestions = [createSuggestion(10, 15, 'Perfect Time')];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={60}
      />
    );

    const copyButton = screen.getByRole('button', { name: /Copy meeting time/i });
    await user.click(copyButton);

    // Check for success feedback
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
  });

  it('should have copy buttons for each suggestion', () => {
    const suggestions = [
      createSuggestion(10, 15, 'Perfect Time'),
      createSuggestion(14, 19, 'Acceptable Time'),
    ];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={120}
      />
    );

    // Check that there are copy buttons for each suggestion
    const copyButtons = screen.getAllByRole('button', { name: /Copy meeting time/i });
    expect(copyButtons).toHaveLength(2);
  });

  it('should display current times for both cities', () => {
    const suggestions = [createSuggestion(10, 15, 'Perfect Time')];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={60}
      />
    );

    expect(screen.getByText(/Current time in New York/i)).toBeInTheDocument();
    expect(screen.getByText(/Current time in London/i)).toBeInTheDocument();
  });

  it('should display limited overlap warning when duration < 60 minutes', () => {
    const suggestions = [createSuggestion(10, 15, 'Perfect Time')];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={45}
      />
    );

    expect(screen.getByText(/Limited overlap/i)).toBeInTheDocument();
    expect(screen.getByText(/Less than 1 hour/i)).toBeInTheDocument();
  });

  it('should not display limited overlap warning when duration >= 60 minutes', () => {
    const suggestions = [createSuggestion(10, 15, 'Perfect Time')];

    render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={60}
      />
    );

    expect(screen.queryByText(/Limited overlap/i)).not.toBeInTheDocument();
  });

  it('should highlight the largest overlap', () => {
    const suggestions = [
      createSuggestion(10, 15, 'Perfect Time'),
      { ...createSuggestion(14, 19, 'Acceptable Time'), durationMinutes: 120 }, // Largest
      createSuggestion(17, 22, 'Not Recommended'),
    ];

    const { container } = render(
      <MeetingSuggestions
        suggestions={suggestions}
        cityA={cityA}
        cityB={cityB}
        overlapDurationMinutes={180}
      />
    );

    // Check that "Largest Overlap" badge is present
    expect(screen.getByText('Largest Overlap')).toBeInTheDocument();

    // Check that the largest suggestion has the special class
    const largestSuggestion = container.querySelector('.suggestion-largest');
    expect(largestSuggestion).toBeInTheDocument();
  });
});
