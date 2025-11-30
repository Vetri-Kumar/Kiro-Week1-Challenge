import React, { useState } from 'react';
import { DateTime } from 'luxon';
import type { City, MeetingSuggestion } from '../types';
import { MeetingSuggester } from '../calculators/MeetingSuggester';
import './MeetingSuggestions.css';

interface MeetingSuggestionsProps {
  suggestions: MeetingSuggestion[];
  cityA: City;
  cityB: City;
  overlapDurationMinutes: number;
}

export const MeetingSuggestions: React.FC<MeetingSuggestionsProps> = ({
  suggestions,
  cityA,
  cityB,
  overlapDurationMinutes,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const suggester = new MeetingSuggester();

  // Get current times for both cities
  const currentTimeA = DateTime.now().setZone(cityA.timezone);
  const currentTimeB = DateTime.now().setZone(cityB.timezone);

  // Find the largest overlap
  const largestOverlap = suggester.findLargestOverlap(suggestions);

  // Check if clipboard API is available
  const isClipboardAvailable = (): boolean => {
    return !!(navigator.clipboard && navigator.clipboard.writeText);
  };

  // Handle copy to clipboard
  const handleCopy = async (suggestion: MeetingSuggestion, index: number) => {
    const formattedText = suggester.formatMeetingSuggestion(suggestion, cityA, cityB);
    
    // Check if clipboard API is available
    if (!isClipboardAvailable()) {
      setCopyError('Clipboard not available. Please copy manually: ' + formattedText);
      setTimeout(() => setCopyError(null), 5000);
      return;
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopiedIndex(index);
      setCopyError(null);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      
      // Provide fallback message
      setCopyError('Unable to copy to clipboard. Please copy manually: ' + formattedText);
      setTimeout(() => setCopyError(null), 5000);
    }
  };

  // Show limited overlap warning
  const showLimitedOverlapWarning = overlapDurationMinutes < 60;

  if (suggestions.length === 0) {
    return (
      <div className="meeting-suggestions">
        <h3>Meeting Suggestions</h3>
        <p className="no-suggestions">No overlapping working hours found. Consider adjusting working hours or choosing different cities.</p>
      </div>
    );
  }

  return (
    <div className="meeting-suggestions">
      <h3 id="meeting-suggestions-heading">Meeting Suggestions</h3>
      
      {/* Current times display */}
      <div className="current-times" role="region" aria-labelledby="current-times-heading">
        <h4 id="current-times-heading" className="visually-hidden">Current Local Times</h4>
        <div className="current-time">
          <span className="current-time-label" id={`current-time-${cityA.name}`}>
            Current time in {cityA.name}:
          </span>
          <span className="current-time-value" aria-labelledby={`current-time-${cityA.name}`}>
            {currentTimeA.toFormat('hh:mm a')}
          </span>
        </div>
        <div className="current-time">
          <span className="current-time-label" id={`current-time-${cityB.name}`}>
            Current time in {cityB.name}:
          </span>
          <span className="current-time-value" aria-labelledby={`current-time-${cityB.name}`}>
            {currentTimeB.toFormat('hh:mm a')}
          </span>
        </div>
      </div>

      {/* Limited overlap warning */}
      {showLimitedOverlapWarning && (
        <div className="limited-overlap-warning" role="alert">
          ⚠️ Limited overlap: Less than 1 hour of overlapping working hours available.
        </div>
      )}

      {/* Copy error message */}
      {copyError && (
        <div className="copy-error" role="alert">
          {copyError}
        </div>
      )}

      {/* Suggestions list */}
      <div className="suggestions-list" role="list" aria-labelledby="meeting-suggestions-heading">
        {suggestions.map((suggestion, index) => {
          const isLargest = largestOverlap && 
            suggestion.timeInCityA.equals(largestOverlap.timeInCityA) &&
            suggestion.timeInCityB.equals(largestOverlap.timeInCityB);
          
          const formattedText = suggester.formatMeetingSuggestion(suggestion, cityA, cityB);

          return (
            <div
              key={index}
              role="listitem"
              className={`suggestion-item ${isLargest ? 'suggestion-largest' : ''} quality-${suggestion.quality.toLowerCase().replace(' ', '-')}`}
              aria-label={`Meeting suggestion ${index + 1} of ${suggestions.length}: ${formattedText}, Quality: ${suggestion.quality}${isLargest ? ', Largest overlap period' : ''}`}
            >
              <div className="suggestion-content">
                <div className="suggestion-time" id={`suggestion-time-${index}`}>
                  {formattedText}
                </div>
                <div className="suggestion-meta" role="group" aria-label="Meeting quality indicators">
                  <span 
                    className={`quality-badge quality-${suggestion.quality.toLowerCase().replace(' ', '-')}`}
                    role="status"
                    aria-label={`Quality: ${suggestion.quality}`}
                  >
                    {suggestion.quality}
                  </span>
                  {isLargest && (
                    <span 
                      className="largest-badge"
                      role="status"
                      aria-label="This is the largest overlap period"
                    >
                      Largest Overlap
                    </span>
                  )}
                </div>
              </div>
              <button
                className="copy-button"
                onClick={() => handleCopy(suggestion, index)}
                aria-label={`Copy meeting time: ${formattedText}`}
                aria-describedby={`suggestion-time-${index}`}
              >
                {copiedIndex === index ? '✓ Copied' : '📋 Copy'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
