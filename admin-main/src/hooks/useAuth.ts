import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'attendee' | 'host' | 'admin';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        if (data) {
          setUser({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

// Check for an existing session on load
supabase.auth.getSession().then(async ({ data: { session } }) => {
  if (session?.user) {
    await fetchProfile(session.user.id);
  }
  setLoading(false);
});

    // L// Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
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
      console.error('useAuth signIn error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error('Signup did not return a user');

      // Create matching profile row in our users table
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: name || email.split('@')[0],
        email: email,
        role: 'admin', // Set as admin for now
        status: 'active',
      });

      if (profileError) throw profileError;
    } catch (error) {
      console.error('useAuth signUp error:', error);
      throw error;
    }
  };
  const signOutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('useAuth signOut error:', error);
      throw error;
    }
  };
  
  return {
    user,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
  };
}
