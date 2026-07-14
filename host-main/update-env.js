#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 Updating HostDWeb Firebase Configuration');
console.log('============================================\n');

// Firebase configuration from your events-app
const firebaseConfig = `# Firebase Configuration - Using same config as events-app
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mobi-c064c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mobi-c064c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mobi-c064c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=964234380308
NEXT_PUBLIC_FIREBASE_APP_ID=1:964234380308:web:84e56e1f6ae92917dfd301
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, firebaseConfig);
  console.log('✅ Successfully updated .env.local with your Firebase configuration!');
  console.log('\n📋 Configuration Details:');
  console.log('• Project ID: mobi-c064c');
  console.log('• Auth Domain: mobi-c064c.firebaseapp.com');
  console.log('• Storage Bucket: mobi-c064c.firebasestorage.app');
  console.log('\n🚀 Now you can run: npm run dev');
  console.log('🎯 Your HostDWeb app will use the same Firebase project as your events-app!');
} catch (error) {
  console.error('❌ Error updating .env.local:', error.message);
  console.log('\n📝 Manual Update Required:');
  console.log('Please create/update .env.local with this content:');
  console.log('\n' + firebaseConfig);
}



