# Firebase Setup Instructions

## 🔥 Firebase Configuration Required

To run the HostDWeb application, you need to set up Firebase with your project credentials.

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project
3. Follow the setup wizard

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" and "Google" providers

### Step 3: Enable Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database

### Step 4: Enable Storage
1. In Firebase Console, go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select a location for your storage

### Step 5: Get Configuration
1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web app" icon (</>) to add web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

### Step 6: Set Environment Variables
Create a `.env.local` file in the project root with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 7: Set Up Firestore Security Rules
In Firebase Console, go to Firestore Database > Rules and use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events can be read by anyone, written by hosts
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && 
        (resource == null || resource.data.hostId == request.auth.uid);
    }
    
    // Tickets can be read by event hosts and ticket owners
    match /tickets/{ticketId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         exists(/databases/$(database)/documents/events/$(resource.data.eventId)) &&
         get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.hostId == request.auth.uid);
      allow write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 8: Set Up Storage Security Rules
In Firebase Console, go to Storage > Rules and use:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 After Setup
1. Run `npm run dev` to start the development server
2. The application will now connect to your Firebase project
3. You can create events and they will be stored in Firestore
4. Authentication will work with your Firebase Auth setup

## 📱 Mobile App Integration
This web app uses the same Firebase project as your mobile app, so:
- Users can login with the same credentials
- Events created on web appear in mobile app
- Real-time updates work across both platforms
- All data is synchronized automatically



