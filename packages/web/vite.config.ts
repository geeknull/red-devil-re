import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// 直接把工作区包映射到 TS 源，免去预构建步骤。
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@red-devil/j2me-shim": r("../j2me-shim/src/index.ts"),
      "@red-devil/game1": r("../game1/src/index.ts"),
      "@red-devil/game2": r("../game2/src/index.ts"),
    },
  },
  // 2005 = 原版红魔特种兵发行年，致敬「原汁原味复刻」；安全（>1024、不在浏览器 ERR_UNSAFE_PORT 名单）。
  server: { port: 2005, host: true },
});
