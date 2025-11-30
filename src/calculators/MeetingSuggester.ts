import { DateTime } from 'luxon';
import type { OverlapResult, MeetingSuggestion, MeetingQuality, WorkingHours, City } from '../types';

/**
 * MeetingSuggester generates meeting time suggestions from overlap windows
 * and categorizes them by quality.
 */
export class MeetingSuggester {
  /**
   * Generate meeting time suggestions from an overlap window
   * Creates suggestions at 30-minute intervals within the overlap
   * @param overlap - The calculated overlap result
   * @param cityA - First city (for formatting)
   * @param cityB - Second city (for formatting)
   * @param workingHoursA - Working hours for city A
   * @param workingHoursB - Working hours for city B
   * @returns Array of meeting suggestions
   */
  generateSuggestions(
    overlap: OverlapResult,
    cityA: City,
    cityB: City,
    workingHoursA: WorkingHours,
    workingHoursB: WorkingHours
  ): MeetingSuggestion[] {
    if (!overlap.hasOverlap || !overlap.overlapInCityA || !overlap.overlapInCityB) {
      return [];
    }

    const suggestions: MeetingSuggestion[] = [];
    const intervalMinutes = 30;

    // Generate suggestions at 30-minute intervals
    let currentTimeA = overlap.overlapInCityA.start;
    let currentTimeB = overlap.overlapInCityB.start;

    while (currentTimeA < overlap.overlapInCityA.end) {
      // Calculate quality for this time slot
      const qualityA = this.categorizeMeetingTime(currentTimeA, workingHoursA, cityA.timezone);
      const qualityB = this.categorizeMeetingTime(currentTimeB, workingHoursB, cityB.timezone);
      
      // Overall quality is the worse of the two
      const quality = this.combineQualities(qualityA, qualityB);

      // Calculate remaining duration from this point
      const remainingDuration = overlap.overlapInCityA.end.diff(currentTimeA, 'minutes').minutes;
      const durationMinutes = Math.min(remainingDuration, 60); // Cap at 60 minutes per suggestion

      suggestions.push({
        timeInCityA: currentTimeA,
        timeInCityB: currentTimeB,
        quality,
        durationMinutes
      });

      // Move to next interval
      currentTimeA = currentTimeA.plus({ minutes: intervalMinutes });
      currentTimeB = currentTimeB.plus({ minutes: intervalMinutes });
    }

    return suggestions;
  }

  /**
   * Categorize a meeting time based on its position within working hours
   * @param time - The meeting time to categorize
   * @param workingHours - The working hours to compare against
   * @param timezone - The timezone for the working hours
   * @returns Quality category
   */
  categorizeMeetingTime(
    time: DateTime,
    workingHours: WorkingHours,
    timezone: string
  ): MeetingQuality {
    // Ensure time is in the correct timezone
    const localTime = time.setZone(timezone);
    const hour = localTime.hour;
    const minute = localTime.minute;
    const timeInMinutes = hour * 60 + minute;

    const startMinutes = workingHours.start * 60;
    const endMinutes = workingHours.end * 60;
    const totalMinutes = endMinutes - startMinutes;

    // Check if outside working hours
    if (timeInMinutes < startMinutes || timeInMinutes >= endMinutes) {
      return 'Not Recommended';
    }

    // Calculate position within working hours (0 to 1)
    const positionInDay = (timeInMinutes - startMinutes) / totalMinutes;

    // Middle third (0.33 to 0.67) is "Perfect Time"
    if (positionInDay >= 1/3 && positionInDay < 2/3) {
      return 'Perfect Time';
    }

    // First or last third is "Acceptable Time"
    return 'Acceptable Time';
  }

  /**
   * Combine two quality ratings to get the overall quality
   * The overall quality is the worse of the two
   */
  private combineQualities(qualityA: MeetingQuality, qualityB: MeetingQuality): MeetingQuality {
    const qualityOrder: MeetingQuality[] = ['Perfect Time', 'Acceptable Time', 'Not Recommended'];
    const indexA = qualityOrder.indexOf(qualityA);
    const indexB = qualityOrder.indexOf(qualityB);
    
    // Return the worse quality (higher index)
    return qualityOrder[Math.max(indexA, indexB)];
  }

  /**
   * Format a meeting suggestion as a string
   * Format: "HH:MM AM/PM CityA ↔ HH:MM AM/PM CityB"
   * @param suggestion - The meeting suggestion to format
   * @param cityA - First city
   * @param cityB - Second city
   * @returns Formatted string
   */
  formatMeetingSuggestion(
    suggestion: MeetingSuggestion,
    cityA: City,
    cityB: City
  ): string {
    const timeA = suggestion.timeInCityA.toFormat('hh:mm a');
    const timeB = suggestion.timeInCityB.toFormat('hh:mm a');
    
    return `${timeA} ${cityA.name} ↔ ${timeB} ${cityB.name}`;
  }

  /**
   * Identify the suggestion with the largest overlap duration
   * @param suggestions - Array of meeting suggestions
   * @returns The suggestion with the longest duration, or null if empty
   */
  findLargestOverlap(suggestions: MeetingSuggestion[]): MeetingSuggestion | null {
    if (suggestions.length === 0) {
      return null;
    }

    return suggestions.reduce((largest, current) => 
      current.durationMinutes > largest.durationMinutes ? current : largest
    );
  }
}
