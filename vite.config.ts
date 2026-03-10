import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@/contexts": path.resolve(__dirname, "./src/components/contexts"),
      "@/hooks": path.resolve(__dirname, "./src/components/hooks"),
      "@/lib": path.resolve(__dirname, "./src/components/lib"),
      "@/integrations": path.resolve(__dirname, "./src/components/integrations"),
      "@/types": path.resolve(__dirname, "./src/components/types"),
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
}));
