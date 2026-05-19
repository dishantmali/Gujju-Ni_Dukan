export const getBackendErrorMessage = (error: any, fallback: string): string => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data.substring(0, 150);
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    if (data.message) return data.message;
    
    // Handle Django REST framework field errors (e.g., {"email": ["This email is already in use."]})
    if (typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      const val = data[firstKey];
      if (Array.isArray(val) && val.length > 0) {
        return `${firstKey}: ${val[0]}`;
      }
      if (typeof val === 'string') return val;
    }
  }
  return error.message || fallback;
};
