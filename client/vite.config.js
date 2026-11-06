import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api calls go to the Express server so the browser sees one origin.
// Port 5001 because macOS AirPlay Receiver already uses 5000.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:5001" } },
});
