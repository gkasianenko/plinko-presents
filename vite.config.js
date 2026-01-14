import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ mode }) => {
  let gameMode = "click";

  if (mode && mode !== "development") {
    gameMode = mode;
  }

  return {
    base: "./",
    //Закомментить плагин, если не нужен формат playable
    plugins: [viteSingleFile()],
    build: {
      outDir:
        mode === "auto"
          ? "dist/game-plinko-auto"
          : mode === "click"
          ? "dist/game-plinko-click"
          : "dist",
      assetsDir: "assets",
      //Закомментить до rollupOptions, если не нужен формат playable
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      reportCompressedSize: false,
      rollupOptions: {
        //Закомментить inlineImports, если не нужен формат playable
        inlineDynamicImports: true,
        input: {
          main: "/index.html",
        },
      },
    },
    server: {
      allowedHosts: ["devotedly-lavish-beetle.cloudpub.ru"],
    },
    define: {
      "import.meta.env.GAME_MODE": JSON.stringify(gameMode),
    },
  };
});
