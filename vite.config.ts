import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Project site on GitHub Pages is served from /sealguy/.
// Local dev/preview use root so the app loads at http://localhost:5173/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/sealguy/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
  },
}));
