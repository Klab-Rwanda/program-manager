# Program Manager Mobile App

A React Native mobile application for Program Managers and Trainees, built with Expo.

## Features

### For Trainees:
- Dashboard with attendance statistics and progress tracking
- Attendance marking via QR code and geolocation
- View enrolled programs and assignments
- Profile management

### For Program Managers:
- Dashboard with program statistics
- Program management and approvals
- Course oversight
- Profile management

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. Navigate to the mobile app directory:
```bash
cd mobile/ProgramManagerMobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── trainee/        # Trainee-specific screens
│   └── manager/        # Program Manager screens
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## API Integration

The mobile app connects to the same backend API as the web application:
- Base URL: `http://localhost:8000/api/v1`
- Authentication via JWT tokens
- AsyncStorage for token persistence

## Key Dependencies

- **React Native**: Core framework
- **Expo**: Development platform and tools
- **React Navigation**: Navigation between screens
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local storage for tokens
- **Expo Location**: GPS location services
- **Expo Camera**: Camera and QR code scanning

## Development Notes

- The app reuses existing backend API endpoints
- No new business logic is created - only UI conversion from web to mobile
- Role-based navigation (Trainee vs Program Manager)
- Responsive design for different screen sizes

## Building for Production

1. Configure app.json with your app details
2. Run `expo build:android` or `expo build:ios`
3. Follow Expo's deployment instructions

## Troubleshooting

- If you encounter Metro bundler issues, try `expo start --clear`
- For iOS simulator issues, ensure Xcode is properly installed
- For Android issues, ensure Android Studio and SDK are configured 