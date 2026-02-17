export const getApiRoot = (): string => {
  // Support both Vite and Next-style env names, fallback to localhost:3000
  const env = (import.meta as any).env || {};
  const raw = (env.VITE_API_URL || env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') as string;
  const trimmed = raw.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};
