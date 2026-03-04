export const getApiRoot = (): string => {
  // Support both Vite and Next-style env names, fallback to localhost:3000
  const raw = (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:3000') as string;
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};
