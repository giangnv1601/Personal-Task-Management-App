// Supabase constants
const getEnv = (key) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};
export const SUPABASE_URL = getEnv("VITE_SUPABASE_URL");
export const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY");

