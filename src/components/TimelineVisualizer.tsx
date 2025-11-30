import React from 'react';
import type { City, WorkingHours, OverlapResult } from '../types';
import './TimelineVisualizer.css';

interface TimelineVisualizerProps {
  cityA: City;
  cityB: City;
  workingHoursA: WorkingHours;
  workingHoursB: WorkingHours;
  overlap: OverlapResult;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  cityA,
  cityB,
  workingHoursA,
  workingHoursB,
  overlap,
}) => {
  // Generate time markers for 24-hour period (every 3 hours)
  const timeMarkers = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // Format hour to 12-hour format with AM/PM
  const formatHour = (hour: number): string => {
    if (hour === 0 || hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Calculate position and width percentages for working hours blocks
  const calculateBlockStyle = (start: number, end: number) => {
    // Handle midnight spanning
    if (end <= start) {
      end = end + 24;
    }
    
    const left = (start / 24) * 100;
    const width = ((end - start) / 24) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  // Calculate overlap block style if overlap exists
  const getOverlapStyle = () => {
    if (!overlap.hasOverlap || !overlap.overlapInCityA) {
      return null;
    }

    const overlapStart = overlap.overlapInCityA.start.hour + overlap.overlapInCityA.start.minute / 60;
    const overlapEnd = overlap.overlapInCityA.end.hour + overlap.overlapInCityA.end.minute / 60;
    
    return calculateBlockStyle(overlapStart, overlapEnd);
  };

  const cityAStyle = calculateBlockStyle(workingHoursA.start, workingHoursA.end);
  const cityBStyle = calculateBlockStyle(workingHoursB.start, workingHoursB.end);
  const overlapStyle = getOverlapStyle();

  // Create descriptive text for screen readers
  const getScreenReaderDescription = (): string => {
    const cityAHours = `${cityA.name} working hours: ${formatHour(workingHoursA.start)} to ${formatHour(workingHoursA.end)}`;
    const cityBHours = `${cityB.name} working hours: ${formatHour(workingHoursB.start)} to ${formatHour(workingHoursB.end)}`;
    
    if (overlap.hasOverlap && overlap.durationMinutes) {
      const overlapDesc = `Overlapping period: ${Math.round(overlap.durationMinutes)} minutes`;
      return `${cityAHours}. ${cityBHours}. ${overlapDesc}.`;
    } else {
      return `${cityAHours}. ${cityBHours}. No overlapping working hours found.`;
    }
  };

  return (
    <div 
      className="timeline-visualizer" 
      role="region" 
      aria-label="Working hours timeline"
      aria-describedby="timeline-description"
    >
      <div className="visually-hidden" id="timeline-description">
        {getScreenReaderDescription()}
      </div>
      <div className="timeline-header">
        <h3>Working Hours Comparison</h3>
      </div>

      {/* City A Timeline */}
      <div className="timeline-row">
        <div className="timeline-label" id="city-a-label">
          <span className="city-name">{cityA.name}</span>
          <span className="timezone-info">{cityA.timezone}</span>
        </div>
        <div className="timeline-track" role="presentation">
          <div
            className="timeline-block city-a-block"
            style={cityAStyle}
            role="img"
            aria-labelledby="city-a-label"
            aria-label={`${cityA.name} working hours from ${formatHour(workingHoursA.start)} to ${formatHour(workingHoursA.end)}`}
          >
            <span className="block-label" aria-hidden="true">
              {formatHour(workingHoursA.start)} - {formatHour(workingHoursA.end)}
            </span>
          </div>
        </div>
      </div>

      {/* City B Timeline */}
      <div className="timeline-row">
        <div className="timeline-label" id="city-b-label">
          <span className="city-name">{cityB.name}</span>
          <span className="timezone-info">{cityB.timezone}</span>
        </div>
        <div className="timeline-track" role="presentation">
          <div
            className="timeline-block city-b-block"
            style={cityBStyle}
            role="img"
            aria-labelledby="city-b-label"
            aria-label={`${cityB.name} working hours from ${formatHour(workingHoursB.start)} to ${formatHour(workingHoursB.end)}`}
          >
            <span className="block-label" aria-hidden="true">
              {formatHour(workingHoursB.start)} - {formatHour(workingHoursB.end)}
            </span>
          </div>
        </div>
      </div>

      {/* Overlap Visualization */}
      <div className="timeline-row overlap-row">
        <div className="timeline-label" id="overlap-label">
          <span className="overlap-label">
            {overlap.hasOverlap ? 'Overlap' : 'No Overlap'}
          </span>
        </div>
        <div className="timeline-track" role="presentation">
          {overlap.hasOverlap && overlapStyle ? (
            <div
              className="timeline-block overlap-block"
              style={overlapStyle}
              role="img"
              aria-labelledby="overlap-label"
              aria-label={`Overlapping period: ${Math.round(overlap.durationMinutes || 0)} minutes`}
            >
              <span className="block-label" aria-hidden="true">
                {Math.round(overlap.durationMinutes || 0)} min
              </span>
            </div>
          ) : (
            <div className="no-overlap-indicator" role="status" aria-live="polite">
              <span>No overlapping hours</span>
            </div>
          )}
        </div>
      </div>

      {/* Time Markers */}
      <div className="timeline-markers" role="presentation" aria-hidden="true">
        <div className="timeline-label"></div>
        <div className="timeline-track">
          {timeMarkers.map((hour) => (
            <div
              key={hour}
              className="time-marker"
              style={{ left: `${(hour / 24) * 100}%` }}
            >
              <span className="marker-label">{formatHour(hour)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
