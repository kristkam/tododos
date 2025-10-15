# Firebase Integration Setup

This todo application uses Firebase Firestore as its primary data storage backend with real-time synchronization.

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

- **Real-time synchronization** across multiple devices/tabs
- **Cloud persistence** - data survives browser clearing
- **Automatic conflict resolution**
- **Network-aware error handling**
- **Optimistic updates** with error recovery

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

## Error Handling

The app includes comprehensive error handling:
- Network connectivity issues
- Firebase authentication errors
- Firestore permission errors
- Data validation errors

All errors are displayed via toast notifications and logged to the console for debugging.

## Development

To test the Firebase integration:

1. Make sure you have a `.env.local` file with valid Firebase configuration
2. Start the development server: `yarn dev`
3. Open multiple browser tabs to see real-time synchronization

## Production Considerations

For production deployment:

1. **Security Rules:** Implement proper Firestore security rules with user authentication
2. **Authentication:** Add Firebase Auth to restrict access to user-specific data
3. **Environment Variables:** Ensure all Firebase config variables are properly set in your hosting environment
4. **Error Monitoring:** Consider adding error tracking services
5. **Performance:** Monitor Firestore usage and optimize queries if needed

## Architecture

The app now uses a simplified, Firebase-only architecture:

- **`useTodoLists` hook** - Manages all data operations and real-time sync
- **`todoStorage`** - Firebase service layer with CRUD operations
- **`firebaseService`** - Low-level Firestore operations
- **Current list ID** - Still stored in localStorage as UI state (not data)