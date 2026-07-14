'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
interface AuthContextType {
  user: User | null;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async (authUser: User) => {
      setUser(authUser);
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) throw error;

        if (userData) {
          const profile = {
            id: authUser.id,
            name: userData.name || authUser.email?.split('@')[0],
            email: userData.email || authUser.email,
            role: userData.role || 'attendee',
            ...userData,
          };
          setUserProfile(profile);
          logger.setUser(profile.id, profile.email ?? undefined, profile.role);
          logger.logAuthEvent('user_profile_loaded', { userId: profile.id, role: profile.role });
        } else {
          // Create user profile if it doesn't exist
          const newProfile = {
            id: authUser.id,
            name: authUser.email?.split('@')[0],
            email: authUser.email,
            role: 'attendee',
            status: 'active',
          };
          const { error: insertError } = await supabase.from('users').insert(newProfile);
          if (insertError) throw insertError;

          setUserProfile(newProfile);
          logger.setUser(newProfile.id, newProfile.email ?? undefined, newProfile.role);
          logger.logAuthEvent('user_profile_loaded', { userId: newProfile.id, role: newProfile.role });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        logger.error('Failed to fetch user profile', {
          context: 'AuthContext',
          operation: 'fetchUserProfile',
          error: error as Error,
        });
        const fallbackProfile = {
          id: authUser.id,
          name: authUser.email?.split('@')[0],
          email: authUser.email,
          role: 'attendee',
        };
        setUserProfile(fallbackProfile);
        logger.setUser(fallbackProfile.id, fallbackProfile.email ?? undefined, fallbackProfile.role);
        logger.logAuthEvent('user_profile_created', { userId: fallbackProfile.id });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
        logger.clearUser();
        logger.logAuthEvent('user_logged_out');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      logger.logAuthEvent('sign_in_attempt', { email });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      logger.logAuthEvent('sign_in_success', { email });
    } catch (error: any) {
      logger.error('Sign in failed', { 
        context: 'AuthContext', 
        operation: 'signIn', 
        metadata: { email },
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      logger.logAuthEvent('sign_up_attempt', { email });
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      // Create user profile row
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: name || email.split('@')[0],
        email: email,
        role: 'attendee',
        status: 'active',
      });
      if (profileError) throw profileError;

      logger.logAuthEvent('sign_up_success', { email, userId: data.user.id });
    } catch (error: any) {
      logger.error('Sign up failed', { 
        context: 'AuthContext', 
        operation: 'signUp', 
        metadata: { email },
        error: error 
      });
      throw new Error(error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      logger.logAuthEvent('google_sign_in_attempt');
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      logger.logAuthEvent('google_sign_in_success');
    } catch (error: any) {
      logger.error('Google sign in failed', { 
        context: 'AuthContext', 
        operation: 'signInWithGoogle',
        error: error 
      });
      throw new Error(error.message);
    }
  };
  const logout = async () => {
    try {
      logger.logAuthEvent('logout_attempt', { userId: userProfile?.id });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      logger.clearUser();
      logger.logAuthEvent('logout_success');
    } catch (error: any) {
      logger.error('Logout failed', { 
        context: 'AuthContext', 
        operation: 'logout',
        error: error 
      });
      throw new Error(error.message);
    }
  };
  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
