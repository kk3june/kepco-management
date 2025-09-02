import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target:
          "http://ec2-3-36-179-72.ap-northeast-2.compute.amazonaws.com:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
