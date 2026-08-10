import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigins: (process.env.CLIENT_ORIGINS ?? 'https://realtimechatapp-e08b.onrender.com')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};