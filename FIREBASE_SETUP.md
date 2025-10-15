# Firebase Integration Setup

This todo application now supports both local storage and Firebase Firestore as storage backends.

## Prerequisites

1. Install Firebase SDK:
   ```bash
   yarn add firebase
   ```

2. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

3. Enable Firestore Database in your Firebase project

## Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Firebase configuration:**
   - Go to Project Settings in Firebase Console
   - Scroll down to "Your apps" section
   - Click on "Config" for your web app
   - Copy the configuration values

3. **Update `.env.local` with your Firebase config:**
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_actual_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
   VITE_FIREBASE_APP_ID=your_actual_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
   
   # Set to 'true' to enable Firebase, 'false' to use localStorage
   VITE_USE_FIREBASE=true
   ```

## Firestore Security Rules

Set up security rules in your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all todo lists
    // You may want to add authentication and user-specific rules later
    match /todoLists/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** The above rules allow public access. For production, you should implement proper authentication and user-specific rules.

## Features

### Firebase Mode (`VITE_USE_FIREBASE=true`)
- Real-time synchronization across multiple devices/tabs
- Cloud persistence - data survives browser clearing
- Automatic conflict resolution
- Network-aware error handling

### Local Storage Mode (`VITE_USE_FIREBASE=false` or not set)
- Offline-first approach
- No network dependency
- Instant operations
- Privacy-focused (data stays local)

## Data Structure

The app stores todo lists in Firestore with this structure:

```
todoLists (collection)
├── [listId] (document)
│   ├── name: string
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── items: array
│       └── [item]
│           ├── id: string
│           ├── text: string
│           ├── completed: boolean
│           └── createdAt: Timestamp
```

## Switching Between Modes

You can switch between Firebase and localStorage by changing the `VITE_USE_FIREBASE` environment variable and restarting the development server.

**Important:** Data is not automatically migrated between modes. If you have data in localStorage and switch to Firebase, you'll start with an empty state and vice versa.

## Error Handling

The app includes comprehensive error handling:
- Network connectivity issues
- Firebase authentication errors
- Firestore permission errors
- Data validation errors

All errors are displayed via toast notifications and logged to the console for debugging.

## Development

To test Firebase integration during development:

1. Make sure you have a `.env.local` file with valid Firebase configuration
2. Set `VITE_USE_FIREBASE=true`
3. Start the development server: `yarn dev`
4. Open multiple browser tabs to see real-time synchronization

## Production Considerations

For production deployment:

1. **Security Rules:** Implement proper Firestore security rules with user authentication
2. **Authentication:** Add Firebase Auth to restrict access to user-specific data
3. **Environment Variables:** Ensure all Firebase config variables are properly set in your hosting environment
4. **Error Monitoring:** Consider adding error tracking services
5. **Performance:** Monitor Firestore usage and optimize queries if needed