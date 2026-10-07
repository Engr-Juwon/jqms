import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom", "zustand"],
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          "vendor-pdf": ["jspdf", "jspdf-autotable", "html2canvas"],
          "vendor-charts": ["recharts"],
          "vendor-firebase": [
            "firebase/app",
            "firebase/firestore",
            "firebase/auth",
          ],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
