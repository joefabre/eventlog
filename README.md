# EventLog

A minimalist web-based event logging system designed for daily tracking and monitoring.

## Features

- Real-time event logging with timestamps
- Automated daily check-ins (08:00 and 20:00)
  - Morning check-in: Weather, property status, vehicle status, health, and upcoming events
  - Evening check-in: Daily mood tracking and future planning
- Event filtering by date range and text
- Print functionality for reports
- Selective event deletion
- Local storage for data persistence

## Technical Details

- Pure HTML, CSS, and JavaScript implementation
- No external dependencies
- Responsive design
- Dark mode interface
- Local storage for data persistence

## Usage

1. Morning Check-in (08:00):
   - Automatically logs weather conditions
   - Prompts for property and vehicle status
   - Health check-in
   - Lists upcoming events

2. Evening Check-in (20:00):
   - Mood tracking
   - Future event planning
   - Daily summary

3. Manual Event Logging:
   - Enter event description
   - Automatic timestamping
   - Event categorization

## Development

### Setup
1. Clone the repository
2. Open index.html in a web browser
3. No build process required

### Weather API Integration
To enable weather updates in morning check-ins:
1. Sign up for OpenWeatherMap API
2. Add your API key to the configuration
3. Set your location

## License

© 2025 by FABREulous Technology. All rights reserved.
