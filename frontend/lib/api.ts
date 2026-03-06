/**
 * Production backend URL (Railway). Use this when the app is served from Vercel
 * so the frontend always talks to the correct API even if env var is wrong/missing.
 */
const PRODUCTION_API_URL = 'https://prepopening-production-c576.up.railway.app';

/**
 * Base URL for the backend API. In the browser on Vercel we use the production
 * URL; otherwise use NEXT_PUBLIC_API_URL or localhost.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin.includes('vercel.app')) {
    return PRODUCTION_API_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}
