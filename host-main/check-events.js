#!/usr/bin/env node

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8",
  authDomain: "mobi-c064c.firebaseapp.com",
  projectId: "mobi-c064c",
  storageBucket: "mobi-c064c.firebasestorage.app",
  messagingSenderId: "964234380308",
  appId: "1:964234380308:web:84e56e1f6ae92917dfd301",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkEvents() {
  console.log('🔍 Checking Firebase Events...\n');
  
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    
    if (eventsSnapshot.empty) {
      console.log('❌ No events found in Firebase database');
      console.log('💡 This means you need to either:');
      console.log('   1. Set your user role to "host" in Firebase');
      console.log('   2. Create an event first to become a host');
      console.log('\n🚀 Go to: http://localhost:3000/admin/set-host');
      console.log('   This will set your user role to "host"');
    } else {
      console.log(`✅ Found ${eventsSnapshot.size} events in database:`);
      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   • ${data.title} (Host: ${data.hostId})`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking events:', error.message);
    console.log('\n💡 Make sure your Firebase configuration is correct');
  }
}

checkEvents();



