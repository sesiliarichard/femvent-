# 🔥 Firebase Configuration Guide

## The Error You're Seeing
```
Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.)
```

This means your Firebase API key is not configured correctly.

## 🚀 Quick Fix Steps

### Step 1: Get Your Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon (⚙️) → Project Settings
4. Scroll down to "Your apps" section
5. Click the web icon (</>) to add a web app
6. Register your app with name "HostDWeb"
7. Copy the configuration object

### Step 2: Create Environment File
Create a file named `.env.local` in your project root with this content:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_from_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Enable Firebase Services
In Firebase Console:

1. **Authentication**:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional)

2. **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode"

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Choose "Start in test mode"

### Step 4: Set Up Security Rules

**Firestore Rules** (Database → Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /tickets/{ticketId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules** (Storage → Rules):
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

### Step 5: Test Your Configuration
1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Go to http://localhost:3000/login
3. Try to sign in - it should work now!

## 🔍 Troubleshooting

### If you still get API key errors:
1. Make sure `.env.local` file is in the project root
2. Check that all environment variables start with `NEXT_PUBLIC_`
3. Restart the development server after creating `.env.local`
4. Verify the API key is correct in Firebase Console

### If you get permission errors:
1. Check your Firestore security rules
2. Make sure Authentication is enabled
3. Verify the user is properly authenticated

## 📱 Mobile App Integration
Since you're using the same Firebase project as your mobile app:
- Users can login with the same credentials
- Events created on web will appear in mobile app
- All data syncs in real-time across platforms

## ✅ Success!
Once configured correctly, you should be able to:
- Sign in with email/password or Google
- Create events that sync with your mobile app
- Manage attendees in real-time
- View analytics and metrics

**Your HostDWeb app will be fully functional!** 🎉
