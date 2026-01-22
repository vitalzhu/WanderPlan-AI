import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // We do NOT define process.env.KEY here because we want to hide it.
    // The keys will be accessed by the serverless function in api/generate.js on Vercel side.
  };
});