import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
        });
        console.log('🔥 Firebase Admin Initialized');
    } catch (error: any) {
        console.log('Firebase admin initialization error', error.stack);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
