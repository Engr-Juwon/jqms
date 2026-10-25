import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
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
      modulePreload: {
        resolveDependencies: (_filename, deps) => {
          // Do not eagerly preload heavy on-demand 3D, PDF, or Chart chunks on initial shell/login load
          return deps.filter(
            (dep) =>
              !dep.includes("vendor-three") &&
              !dep.includes("vendor-pdf") &&
              !dep.includes("vendor-charts"),
          );
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (
              id.includes("node_modules/three/") ||
              id.includes("node_modules/@react-three/")
            ) {
              return "vendor-three";
            }
            if (
              id.includes("node_modules/jspdf") ||
              id.includes("node_modules/html2canvas") ||
              id.includes("node_modules/html2pdf.js")
            ) {
              return "vendor-pdf";
            }
            if (
              id.includes("node_modules/recharts") ||
              id.includes("node_modules/d3-")
            ) {
              return "vendor-charts";
            }
            if (id.includes("node_modules/firebase/")) {
              return "vendor-firebase";
            }
            if (id.includes("node_modules/lucide-react/")) {
              return "vendor-icons";
            }
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/zustand/")
            ) {
              return "vendor-react";
            }
            return undefined;
          },
        },
      },
    },
  };
});
