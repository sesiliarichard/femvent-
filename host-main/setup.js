#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔥 HostDWeb Firebase Setup');
console.log('==========================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file found!');
  console.log('Checking configuration...\n');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasApiKey = envContent.includes('NEXT_PUBLIC_FIREBASE_API_KEY=') && 
                   !envContent.includes('your_actual_api_key_from_firebase');
  
  if (hasApiKey) {
    console.log('✅ Firebase API key is configured!');
    console.log('✅ You should be able to sign in now.');
    console.log('\n🚀 Run: npm run dev');
  } else {
    console.log('❌ Firebase API key not configured properly.');
    console.log('Please update your .env.local file with real Firebase credentials.');
  }
} else {
  console.log('❌ .env.local file not found!');
  console.log('\n📝 Creating .env.local template...');
  
  const envTemplate = `# Firebase Configuration
# Replace these values with your actual Firebase project configuration
# Get these values from: Firebase Console > Project Settings > Web App

NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_from_firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local template');
  console.log('\n📋 Next steps:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project (or create new one)');
  console.log('3. Go to Project Settings > Web App');
  console.log('4. Copy your Firebase configuration');
  console.log('5. Update .env.local with your real values');
  console.log('6. Run: npm run dev');
}

console.log('\n📖 For detailed instructions, see: FIREBASE_CONFIG_GUIDE.md');
console.log('🎯 Once configured, your HostDWeb app will work perfectly!');



