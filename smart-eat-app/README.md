# Smart Eat - Camera Photo Capture

A React Native mobile app for scanning groceries using the device camera.

## Features

- 📸 Camera photo capture functionality
- 🖼️ Image preview with retake option
- 💾 Automatic image storage to device gallery and local app storage
- 📱 Cross-platform support (iOS/Android)
- 🎨 Modern, intuitive UI design
- 🔒 Proper permission handling

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Expo Camera** for camera functionality
- **Expo Media Library** for saving images
- **Expo File System** for local storage

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Navigate to the app directory:
   ```bash
   cd smart-eat-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your preferred platform:
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Usage

1. **Main Screen**: Tap "Scan Groceries" to open the camera
2. **Camera Screen**: Point camera at groceries and tap the capture button
3. **Preview Screen**: Review the captured image
   - Tap "Retake Photo" to capture again
   - Tap "Use Photo" to save and proceed
4. **Success**: Image is saved to both device gallery and app storage

## Permissions

The app requires the following permissions:
- Camera access for photo capture
- Media library access for saving images
- File system access for local storage

## Project Structure

```
smart-eat-app/
├── App.tsx              # Main app component with camera functionality
├── app.json             # Expo configuration with permissions
├── package.json         # Dependencies and scripts
├── jest.config.js       # Test configuration
└── App.test.tsx        # Basic test structure
```

## Testing

Run tests with:
```bash
npm test
```

## Story Implementation Status

✅ **Story 1.1: Camera Photo Capture** - COMPLETED

All acceptance criteria met:
- [x] Camera opens when user taps "Scan Groceries" button
- [x] Photo can be captured using the device camera
- [x] Image is saved to local storage
- [x] User can retake photo if needed
- [x] User can proceed to next step after successful capture

## Development Notes

- Built with React Native and Expo for cross-platform compatibility
- Uses TypeScript for better development experience
- Implements proper error handling and user feedback
- Follows modern UI/UX design principles
- Ready for integration with future AI/ML services for object recognition 