import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" : GitHub Pages 하위 주소(/med-export-helper/)에서도 그대로 열리게
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
