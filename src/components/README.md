# Components

This directory contains React components for the Time Zone Overlap Finder application.

## Implemented Components

### CityInput
Input fields with auto-complete for city selection. Provides debounced search, keyboard navigation, and validation.

### WorkingHoursInput
Time picker inputs for customizing working hours. Features:
- Start and end time selection (24-hour format with AM/PM display)
- Validation to ensure end time is after start time
- Toggle for enabling/disabling custom hours
- Inline error display for invalid configurations

### TimelineVisualizer
Visual timeline showing 24-hour period with working hours comparison. Features:
- Displays working hours blocks for both cities
- Highlights overlapping period with distinct styling
- Shows time markers and labels (every 3 hours)
- Handles no-overlap case with gap indication
- Responsive design for mobile devices
- Accessible with ARIA labels and screen reader support

### MeetingSuggestions
Display of meeting time suggestions with quality indicators. Features:
- Lists meeting time suggestions in both cities' local times
- Shows quality badges (Perfect Time, Acceptable Time, Not Recommended)
- Highlights the largest overlap period
- Displays current local time for both cities
- Shows limited overlap warning when duration < 1 hour
- Copy-to-clipboard functionality for each suggestion
- Success/error feedback for clipboard operations

## Components to be implemented:
- DateSelector - Date selection UI (today/tomorrow)
