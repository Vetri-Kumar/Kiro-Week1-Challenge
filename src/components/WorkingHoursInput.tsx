import React, { useState, useEffect } from 'react';
import type { WorkingHours } from '../types';
import './WorkingHoursInput.css';

interface WorkingHoursInputProps {
  label: string;
  workingHours: WorkingHours;
  onChange: (hours: WorkingHours) => void;
  customEnabled?: boolean;
  onToggleCustom?: (enabled: boolean) => void;
}

export const WorkingHoursInput: React.FC<WorkingHoursInputProps> = ({
  label,
  workingHours,
  onChange,
  customEnabled = true,
  onToggleCustom,
}) => {
  const [startTime, setStartTime] = useState(workingHours.start);
  const [endTime, setEndTime] = useState(workingHours.end);
  const [error, setError] = useState<string | null>(null);

  // Update local state when props change
  useEffect(() => {
    setStartTime(workingHours.start);
    setEndTime(workingHours.end);
    // Validate on prop change
    if (workingHours.end <= workingHours.start) {
      setError('End time must be after start time');
    } else {
      setError(null);
    }
  }, [workingHours]);

  // Validate and emit changes
  const validateAndEmit = (newStart: number, newEnd: number) => {
    if (newEnd <= newStart) {
      setError('End time must be after start time');
      return false;
    } else {
      setError(null);
      onChange({ start: newStart, end: newEnd });
      return true;
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStart = parseInt(e.target.value, 10);
    setStartTime(newStart);
    validateAndEmit(newStart, endTime);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnd = parseInt(e.target.value, 10);
    setEndTime(newEnd);
    validateAndEmit(startTime, newEnd);
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onToggleCustom) {
      onToggleCustom(e.target.checked);
    }
  };

  // Generate hour options (0-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);

  // Format hour for display (e.g., "9 AM", "18 (6 PM)")
  const formatHour = (hour: number): string => {
    if (hour === 0) return '0 (12 AM)';
    if (hour < 12) return `${hour} (${hour} AM)`;
    if (hour === 12) return '12 (12 PM)';
    return `${hour} (${hour - 12} PM)`;
  };

  return (
    <div className="working-hours-container" role="group" aria-labelledby={`working-hours-label-${label}`}>
      <div className="working-hours-header">
        <label id={`working-hours-label-${label}`} className="working-hours-label">{label}</label>
        {onToggleCustom !== undefined && (
          <div className="working-hours-toggle">
            <input
              type="checkbox"
              id={`custom-hours-${label}`}
              checked={customEnabled}
              onChange={handleToggle}
              aria-label={`Enable custom hours for ${label}`}
            />
            <label htmlFor={`custom-hours-${label}`}>Custom hours</label>
          </div>
        )}
      </div>

      <div className="working-hours-inputs">
        <div className="time-input-group">
          <label htmlFor={`start-time-${label}`} className="time-label">
            Start time
          </label>
          <select
            id={`start-time-${label}`}
            value={startTime}
            onChange={handleStartChange}
            disabled={!customEnabled}
            className="time-select"
            aria-label={`Start time for ${label}`}
            aria-describedby={error ? `error-${label}` : undefined}
            aria-invalid={error ? 'true' : 'false'}
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
        </div>

        <div className="time-input-group">
          <label htmlFor={`end-time-${label}`} className="time-label">
            End time
          </label>
          <select
            id={`end-time-${label}`}
            value={endTime}
            onChange={handleEndChange}
            disabled={!customEnabled}
            className="time-select"
            aria-label={`End time for ${label}`}
            aria-describedby={error ? `error-${label}` : undefined}
            aria-invalid={error ? 'true' : 'false'}
          >
            {hourOptions.map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div id={`error-${label}`} className="working-hours-error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
    </div>
  );
};
