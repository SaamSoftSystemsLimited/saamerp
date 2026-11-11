import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative assets work on both organization and repository Pages URLs.
export default defineConfig({ plugins: [react()], base: "./" });
