import { DateTime } from 'luxon';

export interface City {
  name: string;
  country: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface WorkingHours {
  start: number; // hour in 24h format (0-23)
  end: number;   // hour in 24h format (0-23)
}

export interface TimeRange {
  start: DateTime;
  end: DateTime;
}

export interface OverlapResult {
  hasOverlap: boolean;
  overlapInUTC?: { start: DateTime; end: DateTime };
  overlapInCityA?: { start: DateTime; end: DateTime };
  overlapInCityB?: { start: DateTime; end: DateTime };
  durationMinutes?: number;
}

export type MeetingQuality = 'Perfect Time' | 'Acceptable Time' | 'Not Recommended';

export interface MeetingSuggestion {
  timeInCityA: DateTime;
  timeInCityB: DateTime;
  quality: MeetingQuality;
  durationMinutes: number;
}

export interface AppState {
  cityA: City | null;
  cityB: City | null;
  workingHoursA: WorkingHours;
  workingHoursB: WorkingHours;
  selectedDate: Date;
  customHoursEnabled: boolean;
  overlap: OverlapResult | null;
  suggestions: MeetingSuggestion[];
}
