import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  REDIS_URL: process.env.REDIS_URL!,
};
