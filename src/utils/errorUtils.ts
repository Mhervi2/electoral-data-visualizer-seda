
export const getErrorMessage = (error: any): string => {
  console.log('Processing error:', error);
  
  if (error?.message) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.error?.message) {
    return error.error.message;
  }
  
  console.warn('Unknown error format:', error);
  return 'Error inesperado al cargar los datos';
};
