
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  isAdmin: boolean;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile from our profiles table
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('email, is_admin')
              .eq('id', session.user.id)
              .single();
            
            if (profile && !error) {
              console.log('User profile loaded:', profile);
              setUser({
                email: profile.email,
                isAdmin: profile.is_admin || false
              });
            } else {
              console.error('Error fetching profile:', error);
              // If no profile exists, create one
              if (error?.code === 'PGRST116') {
                console.log('Creating new profile for user:', session.user.email);
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email || '',
                    is_admin: session.user.email === 'superadmin@seda.es'
                  });
                
                if (!insertError) {
                  setUser({
                    email: session.user.email || '',
                    isAdmin: session.user.email === 'superadmin@seda.es'
                  });
                } else {
                  console.error('Error creating profile:', insertError);
                  setUser(null);
                }
              } else {
                setUser(null);
              }
            }
          } catch (error) {
            console.error('Error in profile fetch:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      // The onAuthStateChange will handle setting the user
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        console.log('Login successful for:', email);
        // The onAuthStateChange will handle setting the user
        return true;
      }
    } catch (error) {
      console.error('Login exception:', error);
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = async () => {
    console.log('Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
