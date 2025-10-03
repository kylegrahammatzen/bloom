import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import autoprefixer from "autoprefixer";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    port: 3000,
  },
  css: {
    postcss: {
      plugins: [autoprefixer],
    },
  },
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
