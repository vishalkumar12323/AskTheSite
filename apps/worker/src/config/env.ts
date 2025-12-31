import "dotenv/config";

export const env = {
  REDIS_URL: process.env.REDIS_URL!,
  API_KEY: process.env.API_KEY,
  BASE_URL: process.env.BASE_URL,
};
