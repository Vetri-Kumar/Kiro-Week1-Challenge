import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineVisualizer } from './TimelineVisualizer';
import type { City, WorkingHours, OverlapResult } from '../types';
import { DateTime } from 'luxon';

describe('TimelineVisualizer', () => {
  const cityA: City = {
    name: 'New York',
    country: 'United States',
    timezone: 'America/New_York',
  };

  const cityB: City = {
    name: 'London',
    country: 'United Kingdom',
    timezone: 'Europe/London',
  };

  const defaultWorkingHours: WorkingHours = {
    start: 9,
    end: 18,
  };

  it('should render with overlap', () => {
    const overlap: OverlapResult = {
      hasOverlap: true,
      overlapInUTC: {
        start: DateTime.utc(2024, 1, 1, 14, 0),
        end: DateTime.utc(2024, 1, 1, 18, 0),
      },
      overlapInCityA: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 9, minute: 0 }, { zone: 'America/New_York' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 13, minute: 0 }, { zone: 'America/New_York' }),
      },
      overlapInCityB: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 14, minute: 0 }, { zone: 'Europe/London' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 18, minute: 0 }, { zone: 'Europe/London' }),
      },
      durationMinutes: 240,
    };

    const { container } = render(
      <TimelineVisualizer
        cityA={cityA}
        cityB={cityB}
        workingHoursA={defaultWorkingHours}
        workingHoursB={defaultWorkingHours}
        overlap={overlap}
      />
    );

    // Check city names are displayed
    expect(screen.getByText('New York')).toBeTruthy();
    expect(screen.getByText('London')).toBeTruthy();

    // Check overlap indication
    expect(screen.getByText('Overlap')).toBeTruthy();
    expect(screen.getByText('240 min')).toBeTruthy();

    // Check that working hours blocks are rendered
    expect(container.querySelector('.city-a-block')).toBeTruthy();
    expect(container.querySelector('.city-b-block')).toBeTruthy();
    expect(container.querySelector('.overlap-block')).toBeTruthy();
  });

  it('should render without overlap', () => {
    const noOverlap: OverlapResult = {
      hasOverlap: false,
    };

    const { container } = render(
      <TimelineVisualizer
        cityA={cityA}
        cityB={cityB}
        workingHoursA={defaultWorkingHours}
        workingHoursB={defaultWorkingHours}
        overlap={noOverlap}
      />
    );

    // Check city names are displayed
    expect(screen.getByText('New York')).toBeTruthy();
    expect(screen.getByText('London')).toBeTruthy();

    // Check no overlap indication
    expect(screen.getByText('No Overlap')).toBeTruthy();
    expect(screen.getByText('No overlapping hours')).toBeTruthy();

    // Check that working hours blocks are rendered but not overlap block
    expect(container.querySelector('.city-a-block')).toBeTruthy();
    expect(container.querySelector('.city-b-block')).toBeTruthy();
    expect(container.querySelector('.overlap-block')).toBeFalsy();
  });

  it('should display same timezone correctly', () => {
    const sameCityA: City = {
      name: 'Los Angeles',
      country: 'United States',
      timezone: 'America/Los_Angeles',
    };

    const sameCityB: City = {
      name: 'San Francisco',
      country: 'United States',
      timezone: 'America/Los_Angeles',
    };

    const overlap: OverlapResult = {
      hasOverlap: true,
      overlapInUTC: {
        start: DateTime.utc(2024, 1, 1, 17, 0),
        end: DateTime.utc(2024, 1, 1, 26, 0),
      },
      overlapInCityA: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 9, minute: 0 }, { zone: 'America/Los_Angeles' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 18, minute: 0 }, { zone: 'America/Los_Angeles' }),
      },
      overlapInCityB: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 9, minute: 0 }, { zone: 'America/Los_Angeles' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 18, minute: 0 }, { zone: 'America/Los_Angeles' }),
      },
      durationMinutes: 540,
    };

    const { container } = render(
      <TimelineVisualizer
        cityA={sameCityA}
        cityB={sameCityB}
        workingHoursA={defaultWorkingHours}
        workingHoursB={defaultWorkingHours}
        overlap={overlap}
      />
    );

    // Check both cities are displayed
    expect(screen.getByText('Los Angeles')).toBeTruthy();
    expect(screen.getByText('San Francisco')).toBeTruthy();

    // Check overlap is shown (should be full working hours since same timezone)
    expect(screen.getByText('Overlap')).toBeTruthy();
    expect(screen.getByText('540 min')).toBeTruthy();

    // All blocks should be rendered
    expect(container.querySelector('.city-a-block')).toBeTruthy();
    expect(container.querySelector('.city-b-block')).toBeTruthy();
    expect(container.querySelector('.overlap-block')).toBeTruthy();
  });

  it('should display working hours labels correctly', () => {
    const overlap: OverlapResult = {
      hasOverlap: true,
      overlapInUTC: {
        start: DateTime.utc(2024, 1, 1, 14, 0),
        end: DateTime.utc(2024, 1, 1, 18, 0),
      },
      overlapInCityA: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 9, minute: 0 }, { zone: 'America/New_York' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 13, minute: 0 }, { zone: 'America/New_York' }),
      },
      overlapInCityB: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 14, minute: 0 }, { zone: 'Europe/London' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 18, minute: 0 }, { zone: 'Europe/London' }),
      },
      durationMinutes: 240,
    };

    render(
      <TimelineVisualizer
        cityA={cityA}
        cityB={cityB}
        workingHoursA={defaultWorkingHours}
        workingHoursB={defaultWorkingHours}
        overlap={overlap}
      />
    );

    // Check that working hours are displayed in the blocks (both cities have same hours)
    const workingHoursLabels = screen.getAllByText(/9 AM - 6 PM/);
    expect(workingHoursLabels.length).toBe(2); // One for each city
  });

  it('should handle custom working hours', () => {
    const customHoursA: WorkingHours = {
      start: 8,
      end: 16,
    };

    const customHoursB: WorkingHours = {
      start: 10,
      end: 19,
    };

    const overlap: OverlapResult = {
      hasOverlap: true,
      overlapInUTC: {
        start: DateTime.utc(2024, 1, 1, 15, 0),
        end: DateTime.utc(2024, 1, 1, 21, 0),
      },
      overlapInCityA: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 10, minute: 0 }, { zone: 'America/New_York' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 16, minute: 0 }, { zone: 'America/New_York' }),
      },
      overlapInCityB: {
        start: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 15, minute: 0 }, { zone: 'Europe/London' }),
        end: DateTime.fromObject({ year: 2024, month: 1, day: 1, hour: 21, minute: 0 }, { zone: 'Europe/London' }),
      },
      durationMinutes: 360,
    };

    render(
      <TimelineVisualizer
        cityA={cityA}
        cityB={cityB}
        workingHoursA={customHoursA}
        workingHoursB={customHoursB}
        overlap={overlap}
      />
    );

    // Check custom hours are displayed
    expect(screen.getByText(/8 AM - 4 PM/)).toBeTruthy();
    expect(screen.getByText(/10 AM - 7 PM/)).toBeTruthy();
  });

  it('should display time markers', () => {
    const noOverlap: OverlapResult = {
      hasOverlap: false,
    };

    render(
      <TimelineVisualizer
        cityA={cityA}
        cityB={cityB}
        workingHoursA={defaultWorkingHours}
        workingHoursB={defaultWorkingHours}
        overlap={noOverlap}
      />
    );

    // Check that time markers are displayed (12 AM appears twice: at 0 and 24)
    const twelveAM = screen.getAllByText('12 AM');
    expect(twelveAM.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('6 AM')).toBeTruthy();
    expect(screen.getByText('12 PM')).toBeTruthy();
    expect(screen.getByText('6 PM')).toBeTruthy();
  });
});
