import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SystemConfig {
  mailVotingEnabled: boolean;
}

interface SystemConfigContextType {
  config: SystemConfig;
  setMailVotingEnabled: (enabled: boolean) => void;
  isMailVotingEnabled: () => boolean;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

interface SystemConfigProviderProps {
  children: ReactNode;
}

export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>({
    mailVotingEnabled: true, // Default value
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved system config:', error);
      }
    }
  }, []);

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('systemConfig', JSON.stringify(config));
  }, [config]);

  const setMailVotingEnabled = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      mailVotingEnabled: enabled
    }));
  };

  const isMailVotingEnabled = () => config.mailVotingEnabled;

  const contextValue: SystemConfigContextType = {
    config,
    setMailVotingEnabled,
    isMailVotingEnabled,
  };

  return (
    <SystemConfigContext.Provider value={contextValue}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};