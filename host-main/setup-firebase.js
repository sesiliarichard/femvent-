#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Setup Helper for HostDWeb');
console.log('=====================================\n');

console.log('To set up Firebase for your HostDWeb application:');
console.log('\n1. Go to https://console.firebase.google.com/');
console.log('2. Create a new project or select existing project');
console.log('3. Enable Authentication (Email/Password + Google)');
console.log('4. Enable Firestore Database');
console.log('5. Enable Storage');
console.log('6. Get your Firebase config from Project Settings > Web App');
console.log('\n7. Create a .env.local file in your project root with:');
console.log(`
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
`);

console.log('\n8. Set up Firestore Security Rules:');
console.log(`
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
`);

console.log('\n9. Set up Storage Security Rules:');
console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`);

console.log('\n✅ After setup, run: npm run dev');
console.log('🚀 Your HostDWeb app will be ready!');



