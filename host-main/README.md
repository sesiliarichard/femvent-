# HostDWeb - Event Hosting Platform

A comprehensive web application for event hosts to manage their events, attendees, and analytics. Built with Next.js, Firebase, and Tailwind CSS.

## 🚀 Features

### ✅ **Authentication & Security**
- Firebase Authentication (Email/Password + Google Sign-in)
- Host-only access control
- Protected routes and user context
- Real-time authentication state management

### ✅ **Event Management**
- **Create Events** - Full-featured event creation with:
  - Basic event information (title, description, dates, venue)
  - Speaker management with photos and bios
  - Event agenda with time slots
  - Partner/sponsor information
  - Event poster upload with Firebase Storage
- **Edit Events** - Update existing events
- **Event Dashboard** - Overview of all events

### ✅ **Attendee Management**
- **Real-time Attendee List** - Live updates from Firebase
- **Payment Confirmation** - Manual payment processing
- **Attendee Status Tracking** - Pending/Confirmed status
- **User Information** - Attendee details and contact info

### ✅ **Analytics & Reporting**
- **Real-time Dashboard** - Live metrics and statistics
- **Event Performance** - Revenue, attendance, conversion rates
- **Attendee Analytics** - Registration trends and patterns

### ✅ **Real-time Features**
- **Live Data Sync** - All data updates in real-time
- **Firebase Integration** - Seamless backend connectivity
- **Cross-platform Sync** - Works with mobile app data

## 🏗️ Architecture

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Real-time**: Firebase onSnapshot listeners
- **Authentication**: Firebase Auth with role-based access

## 📁 Project Structure

```
hostdweb/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Host dashboard
│   │   ├── events/             # Event management
│   │   │   ├── create/         # Event creation
│   │   │   └── [id]/           # Event details
│   │   │       └── attendees/  # Attendee management
│   │   ├── analytics/          # Analytics dashboard
│   │   └── login/              # Authentication
│   ├── components/             # Reusable components
│   ├── contexts/              # React contexts
│   └── lib/                   # Firebase configuration
├── public/                    # Static assets
└── FIREBASE_SETUP.md         # Firebase setup instructions
```

## 🔥 Firebase Setup

### Prerequisites
1. Firebase project with Authentication, Firestore, and Storage enabled
2. Environment variables configured

### Environment Variables
Create `.env.local` file:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Security Rules
See `FIREBASE_SETUP.md` for complete Firestore and Storage security rules.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
1. Follow `FIREBASE_SETUP.md` instructions
2. Set up your `.env.local` file
3. Configure Firestore and Storage security rules

### 3. Run Development Server
```bash
npm run dev
```

### 4. Access the Application
- **Homepage**: http://localhost:3000
- **Host Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard (requires host login)

## 📱 Mobile App Integration

This web application shares the same Firebase backend as your mobile app:

- **Same Authentication** - Users can login with same credentials
- **Shared Data** - Events created on web appear in mobile app
- **Real-time Sync** - All changes sync across platforms
- **Unified Experience** - Seamless cross-platform workflow

## 🎯 Key Features Implemented

### **Dashboard**
- Real-time metrics (events, attendees, revenue)
- Recent events overview
- Quick action buttons
- Hosting tips and guidance

### **Event Creation**
- Multi-tab interface (Basic, Speakers, Agenda, Partners)
- File upload for event posters
- Form validation and error handling
- Real-time preview

### **Attendee Management**
- Live attendee list with real-time updates
- Payment confirmation workflow
- Status tracking (pending/confirmed)
- User information display

### **Analytics**
- Event performance metrics
- Revenue tracking
- Conversion rate analysis
- Real-time data visualization

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Tech Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase** - Backend as a Service
- **Firestore** - NoSQL database
- **Firebase Auth** - Authentication service
- **Firebase Storage** - File storage

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Set the same Firebase environment variables in your deployment platform.

## 📊 Real-time Features

- **Live Dashboard Updates** - Metrics update automatically
- **Real-time Event List** - New events appear instantly
- **Attendee Management** - Registration updates in real-time
- **Cross-platform Sync** - Changes sync with mobile app

## 🔐 Security

- **Host-only Access** - Only authenticated hosts can access
- **Firebase Security Rules** - Database and storage protection
- **Role-based Authentication** - User role validation
- **Protected Routes** - Automatic redirect for unauthorized users

## 📈 Performance

- **Server-side Rendering** - Fast initial page loads
- **Real-time Updates** - Efficient Firebase listeners
- **Optimized Images** - Next.js image optimization
- **Code Splitting** - Automatic bundle optimization

## 🎉 Success!

Your HostDWeb application is now fully functional with:
- ✅ Complete authentication system
- ✅ Real-time event management
- ✅ Attendee management with payment processing
- ✅ Analytics and reporting
- ✅ Mobile app integration
- ✅ Professional UI/UX

**Ready for production deployment!** 🚀