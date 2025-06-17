
import { useAppData } from './useAppData';

// Deprecated: Use useAppData instead
// This hook is kept for backward compatibility
export const useActaData = () => {
  console.warn('useActaData is deprecated. Use useAppData instead.');
  return useAppData();
};
