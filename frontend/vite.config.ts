import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "firebase-app": ["firebase/app"],
          "firebase-auth": ["firebase/auth"],
          "firebase-data": ["firebase/firestore"],
          "firebase-storage": ["firebase/storage"],
          "firebase-functions": ["firebase/functions"],
          "firebase-app-check": ["firebase/app-check"],
        },
      },
    },
  },
});
