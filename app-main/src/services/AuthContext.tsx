import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { User } from '../types';
import { setUserContext, trackError } from '../utils/errorTracking';
interface AuthContextType {
  user: User | null;
  firebaseUser: SupabaseAuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<SupabaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (authUser: SupabaseAuthUser) => {
    setFirebaseUser(authUser);

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) throw error;

      if (userData) {
        const userObj: User = {
          id: authUser.id,
          name: userData.name || '',
          email: userData.email || authUser.email || '',
          photoURL: userData.photo_url,
          role: userData.role || 'attendee',
          stripeCustomerId: userData.stripe_customer_id,
          createdAt: userData.created_at ? new Date(userData.created_at) : new Date(),
          isSuspended: userData.status === 'suspended',
          hostApplication: userData.host_application,
          bio: userData.bio,
          phone: userData.phone,
          instagram: userData.instagram,
          twitter: userData.twitter,
          facebook: userData.facebook,
        };
        setUser(userObj);
        setUserContext({ id: userObj.id, email: userObj.email, name: userObj.name, role: userObj.role });
      } else {
        // Create user profile if it doesn't exist
        const newUser = {
          id: authUser.id,
          name: authUser.email?.split('@')[0] || '',
          email: authUser.email || '',
          role: 'attendee',
          status: 'active',
        };

        const { error: insertError } = await supabase.from('users').insert(newUser);
        if (insertError) console.warn('Failed to create user profile:', insertError);

        const newUserObj: User = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: 'attendee',
          createdAt: new Date(),
          isSuspended: false,
        };
        setUser(newUserObj);
        setUserContext({ id: newUserObj.id, email: newUserObj.email, name: newUserObj.name, role: newUserObj.role });
      }
    } catch (error) {
      console.warn('Failed to fetch user profile:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'fetchUserData' });

      const fallbackUser: User = {
        id: authUser.id,
        name: authUser.email?.split('@')[0] || '',
        email: authUser.email || '',
        role: 'attendee',
        createdAt: new Date(),
        isSuspended: false,
      };
      setUser(fallbackUser);
      setUserContext({ id: fallbackUser.id, email: fallbackUser.email, name: fallbackUser.name, role: fallbackUser.role });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setUser(null);
        setFirebaseUser(null);
        setUserContext(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signIn', email });
      throw error;
    }
  };
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      try {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          name,
          email,
          role: 'attendee',
          status: 'active',
        });
        if (insertError) throw insertError;
      } catch (dbError) {
        console.warn('Failed to create user profile:', dbError);
        trackError(dbError as Error, { context: 'AuthContext', operation: 'signUp', email });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signUp', email });
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserContext(null);
    } catch (error) {
      console.error('Sign out error:', error);
      trackError(error as Error, { context: 'AuthContext', operation: 'signOut' });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: updates.name,
            photo_url: updates.photoURL,
            role: updates.role,
          })
          .eq('id', user.id);
        if (error) throw error;
      } catch (dbError) {
        console.warn('Failed to update user profile:', dbError);
      }

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!firebaseUser) return;
    await loadUserProfile(firebaseUser);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
