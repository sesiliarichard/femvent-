import React from 'react';
import * as Sentry from '@sentry/react-native';

// Check if __DEV__ is defined (it should be in Expo, but adding safety check)
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// Initialize Sentry for React Native
try {
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!isDev && sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      debug: false,
      tracesSampleRate: 0.1,
      environment: isDev ? 'development' : 'production',
      beforeSend(event) {
        event.tags = {
          ...event.tags,
          app: 'events-app',
          platform: 'mobile',
        };
        return event;
      },
    });
  }
} catch (error) {
  console.warn('Sentry initialization warning:', error);
}

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/services/AuthContext';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignupScreen } from './src/screens/auth/SignupScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { setupNotificationListeners, requestNotificationPermissions } from './src/services/notifications';
import * as Notifications from 'expo-notifications';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

import EventDetailScreen from './src/screens/EventDetailScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import SpeakersListScreen from './src/screens/SpeakersListScreen';
import SpeakerDetailScreen from './src/screens/SpeakerDetailScreen';
import SponsorScreen from './src/screens/SponsorScreen';
import ChatScreen from './src/screens/ChatScreen';
import GroupChatScreen from './src/screens/GroupChatScreen';
import AttendeesListScreen from './src/screens/AttendeesListScreen';
import PrivateChatScreen from './src/screens/PrivateChatScreen';

// Import the NEW beautiful HomeScreen and EventsScreen
import { HomeScreen } from './src/screens/main/HomeScreen';
import { EventsScreen } from './src/screens/main/EventsScreen';
import { TicketsScreen } from './src/screens/main/TicketsScreen';
import { TicketDetailScreen } from './src/screens/main/TicketDetailScreen';
import { QRScannerScreen } from './src/screens/main/QRScannerScreen';
import { SettingsScreen } from './src/screens/main/SettingsScreen';
import { FavoritesScreen } from './src/screens/main/FavoritesScreen';
import { EditProfileScreen } from './src/screens/main/EditProfileScreen';

import { PaymentHistoryScreen } from './src/screens/PaymentHistoryScreen';
import { HostApplicationScreen } from './src/screens/HostApplicationScreen';
import { SelectEventToScanScreen } from './src/screens/host/SelectEventToScanScreen';
import { ProfileScreen } from './src/screens/main/ProfileScreen';
import { ThemeProvider, useThemeMode } from './src/services/ThemeContext';
import AnimatedSplash from './src/components/AnimatedSplash';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Events') {
            iconName = 'event';
          } else if (route.name === 'Tickets') {
            iconName = 'confirmation-number';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Tickets" component={TicketsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = React.useRef<any>();

  // Request notification permissions when user logs in
  React.useEffect(() => {
    if (user) {
      requestNotificationPermissions();
      // Clear any old notifications
      Notifications.dismissAllNotificationsAsync();
    }
  }, [user]);

  // Setup notification listeners
  React.useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Notification received while app is foregrounded
        console.log('Notification received:', notification);
      },
      (response) => {
        // User tapped on notification
        const { type, ticketId, eventId } = response.notification.request.content.data;

        if (navigationRef.current) {
          if (type === 'ticket_confirmed' && ticketId) {
            navigationRef.current.navigate('TicketDetail', { ticketId });
          } else if (type === 'event_reminder' && eventId) {
            navigationRef.current.navigate('EventDetail', { eventId });
          }
        }
      }
    );

    return cleanup;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="EventDetail"
              component={EventDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TicketDetail"
              component={TicketDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Schedule"
              component={ScheduleScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SpeakersList"
              component={SpeakersListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SpeakerDetail"
              component={SpeakerDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Sponsor"
              component={SponsorScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="GroupChat"
              component={GroupChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AttendeesList"
              component={AttendeesListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrivateChat"
              component={PrivateChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PaymentHistory"
              component={PaymentHistoryScreen}
              options={{ headerShown: true, title: 'Payment History' }}
            />
            <Stack.Screen
              name="HostApplication"
              component={HostApplicationScreen}
              options={{ headerShown: true, title: 'Become a Host' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SelectEventToScan"
              component={SelectEventToScanScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ThemedAppContainer() {
  const { paperTheme, isDark } = useThemeMode();
  const [showSplash, setShowSplash] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        {showSplash ? <AnimatedSplash /> : <AppNavigator />}
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemedAppContainer />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});