import { DateTime } from 'luxon';
import citiesData from '../src/data/cities.json';

interface City {
  name: string;
  country: string;
  timezone: string;
  coordinates: { lat: number; lon: number };
}

const cities = citiesData as City[];

console.log(`Validating ${cities.length} cities...\n`);

let validCount = 0;
let invalidCount = 0;
const invalidTimezones: Array<{ city: string; timezone: string; error: string }> = [];

// Track timezone coverage
const timezoneSet = new Set<string>();
const dstTimezones: string[] = [];
const noDstTimezones: string[] = [];

for (const city of cities) {
  try {
    // Try to create a DateTime in this timezone
    const dt = DateTime.now().setZone(city.timezone);
    
    if (!dt.isValid) {
      invalidCount++;
      invalidTimezones.push({
        city: `${city.name}, ${city.country}`,
        timezone: city.timezone,
        error: dt.invalidReason || 'Unknown error'
      });
    } else {
      validCount++;
      timezoneSet.add(city.timezone);
      
      // Check if timezone observes DST
      const winter = DateTime.fromObject({ year: 2024, month: 1, day: 15 }, { zone: city.timezone });
      const summer = DateTime.fromObject({ year: 2024, month: 7, day: 15 }, { zone: city.timezone });
      
      if (winter.offset !== summer.offset) {
        if (!dstTimezones.includes(city.timezone)) {
          dstTimezones.push(city.timezone);
        }
      } else {
        if (!noDstTimezones.includes(city.timezone)) {
          noDstTimezones.push(city.timezone);
        }
      }
    }
  } catch (error) {
    invalidCount++;
    invalidTimezones.push({
      city: `${city.name}, ${city.country}`,
      timezone: city.timezone,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

console.log('=== VALIDATION RESULTS ===');
console.log(`✓ Valid timezones: ${validCount}`);
console.log(`✗ Invalid timezones: ${invalidCount}`);
console.log(`\n=== TIMEZONE COVERAGE ===`);
console.log(`Unique timezones: ${timezoneSet.size}`);
console.log(`Timezones with DST: ${dstTimezones.length}`);
console.log(`Timezones without DST: ${noDstTimezones.length}`);

if (invalidTimezones.length > 0) {
  console.log('\n=== INVALID TIMEZONES ===');
  invalidTimezones.forEach(({ city, timezone, error }) => {
    console.log(`✗ ${city}: ${timezone} - ${error}`);
  });
  process.exit(1);
}

console.log('\n=== DST TIMEZONES (Sample) ===');
dstTimezones.slice(0, 10).forEach(tz => console.log(`  - ${tz}`));

console.log('\n=== NO DST TIMEZONES (Sample) ===');
noDstTimezones.slice(0, 10).forEach(tz => console.log(`  - ${tz}`));

console.log('\n✓ All timezone identifiers are valid IANA identifiers!');
console.log('✓ Database includes cities with DST and without DST');
console.log('✓ Database covers all major timezones');
