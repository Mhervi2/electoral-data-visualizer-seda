
import React, { createContext, useContext, useState } from 'react';
import { useBiometric } from '@/hooks/useBiometric';

interface UserProfile {
  isAdmin: boolean;
  email: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithBiometric: (email: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  biometric: {
    isSupported: boolean | null;
    isLoading: boolean;
    checkSupport: () => Promise<boolean>;
    registerBiometric: (email: string, deviceName?: string) => Promise<{ success: boolean; error?: string }>;
    authenticateBiometric: (email: string) => Promise<{ success: boolean; error?: string }>;
    getBiometricCredentials: (email: string) => Promise<any[]>;
    removeBiometricCredential: (credentialId: string) => Promise<{ success: boolean; error?: string }>;
  };
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
  const biometric = useBiometric();

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

  const loginWithBiometric = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('Attempting biometric login for:', email);
      
      // Verificar que es el email del admin
      if (email !== 'superadmin@seda.es') {
        console.log('Biometric login only available for admin');
        setIsLoading(false);
        return false;
      }
      
      const result = await biometric.authenticateBiometric(email);
      
      if (result.success) {
        const userProfile: UserProfile = {
          email: email,
          isAdmin: true
        };
        
        console.log('Biometric login successful for:', email);
        setUser(userProfile);
        
        // Store in localStorage for persistence
        localStorage.setItem('admin_user', JSON.stringify(userProfile));
        
        setIsLoading(false);
        return true;
      } else {
        console.log('Biometric authentication failed for:', email);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Biometric login exception:', error);
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

  // Check biometric support on mount
  React.useEffect(() => {
    biometric.checkSupport();
  }, [biometric.checkSupport]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginWithBiometric,
      logout, 
      isLoading, 
      biometric: {
        isSupported: biometric.isSupported,
        isLoading: biometric.isLoading,
        checkSupport: biometric.checkSupport,
        registerBiometric: biometric.registerBiometric,
        authenticateBiometric: biometric.authenticateBiometric,
        getBiometricCredentials: biometric.getBiometricCredentials,
        removeBiometricCredential: biometric.removeBiometricCredential,
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};
