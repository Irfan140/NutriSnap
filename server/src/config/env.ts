function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: parseInt(getEnv("PORT", "3000"), 10),
  GROQ_API_KEY: getEnv("GROQ_API_KEY"),
};
