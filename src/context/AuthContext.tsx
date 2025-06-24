
import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  isAdmin: boolean;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
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
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      
      // Simple hardcoded authentication for admin panel
      if (email === 'superadmin@seda.es' && password === 'AdminFuerte#2024') {
        const userProfile: UserProfile = {
          email: email,
          isAdmin: true
        };
        
        console.log('Login successful for:', email);
        setUser(userProfile);
        
        // Store in localStorage for persistence
        localStorage.setItem('admin_user', JSON.stringify(userProfile));
        
        setIsLoading(false);
        return true;
      } else {
        console.log('Invalid credentials for:', email);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login exception:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  // Check for existing session on component mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    if (storedUser) {
      try {
        const userProfile = JSON.parse(storedUser);
        console.log('Restored user session:', userProfile);
        setUser(userProfile);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('admin_user');
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
