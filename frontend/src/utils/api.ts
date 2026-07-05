export const getApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.location.origin ? window.location.origin : '');

  // If running on localhost, use port 3002
  if (baseUrl.includes('localhost:3000') || !baseUrl.includes('localhost')) {
    return `${baseUrl}/api${endpoint}`;
  }

  // For localhost development
  return `http://localhost:3002/api${endpoint}`;
};
