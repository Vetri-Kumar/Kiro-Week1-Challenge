import React, { useState, useEffect, memo } from 'react';
import './DateSelector.css';

interface DateSelectorProps {
  onDateChange: (date: Date) => void;
  selectedDate?: Date;
}

const DateSelectorComponent: React.FC<DateSelectorProps> = ({
  onDateChange,
  selectedDate,
}) => {
  const [activeDate, setActiveDate] = useState<'today' | 'tomorrow'>('today');
  const [internalDate, setInternalDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Initialize with today if no selectedDate provided
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setInternalDate(today);
      onDateChange(today);
    }
  }, []);

  // Update active state and internal date based on selectedDate prop
  useEffect(() => {
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      setInternalDate(selected);

      if (selected.getTime() === tomorrow.getTime()) {
        setActiveDate('tomorrow');
      } else {
        setActiveDate('today');
      }
    }
  }, [selectedDate]);

  const handleTodayClick = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setActiveDate('today');
    setInternalDate(today);
    onDateChange(today);
  };

  const handleTomorrowClick = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setActiveDate('tomorrow');
    setInternalDate(tomorrow);
    onDateChange(tomorrow);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayDate = selectedDate || internalDate;

  return (
    <div className="date-selector-container" role="group" aria-labelledby="date-selector-label">
      <label id="date-selector-label" className="date-selector-label">Select Date</label>
      <div className="date-selector-buttons" role="group" aria-label="Date selection buttons">
        <button
          type="button"
          className={`date-button ${activeDate === 'today' ? 'date-button-active' : ''}`}
          onClick={handleTodayClick}
          aria-pressed={activeDate === 'today'}
          aria-label="Select today's date"
        >
          Today
        </button>
        <button
          type="button"
          className={`date-button ${activeDate === 'tomorrow' ? 'date-button-active' : ''}`}
          onClick={handleTomorrowClick}
          aria-pressed={activeDate === 'tomorrow'}
          aria-label="Select tomorrow's date"
        >
          Tomorrow
        </button>
      </div>
      <div className="date-display" role="status" aria-live="polite" aria-atomic="true">
        <span className="date-display-label">Selected date: </span>
        <span className="date-display-value">{formatDate(displayDate)}</span>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const DateSelector = memo(DateSelectorComponent);
