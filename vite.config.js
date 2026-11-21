import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// 콘텐츠 팩: 기본은 저장소 안의 예시 팩. 실제 제안 콘텐츠는 PACK_DIR로 저장소 밖 폴더를 지정 (공개 저장소에 넣지 않음)
const PACK = process.env.PACK_DIR ? path.resolve(process.env.PACK_DIR) : path.resolve(import.meta.dirname, "src/pack-default");

export default defineConfig({
  base: "./",
  server: { allowedHosts: ["terminal.local"], fs: { allow: [import.meta.dirname, PACK] } },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@pack": PACK, "@": path.resolve(import.meta.dirname, "src") } },
});
