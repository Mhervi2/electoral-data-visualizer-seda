
import { useAppData } from './useAppData';

// Deprecated: Use useAppData instead  
// This hook is kept for backward compatibility
export const useMpcaData = () => {
  console.warn('useMpcaData is deprecated. Use useAppData instead.');
  const { mpcaData, loading, error } = useAppData();
  return { mpcaData, loading, error };
};
