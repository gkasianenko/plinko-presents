import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { LOCALES as locales } from "./assets/locales/index.js";

export default defineConfig(({ mode }) => {
  let gameMode = "click";
  let gameLocale = 'KR';

  if (mode && mode !== "development") {
    gameMode = mode;
    gameLocale = gameLocale;
  }

  return {
    base: "./",
    //Закомментить плагин viteSingleFile, если не нужен формат playable
    plugins: [
      {
        name: "html-locale-replace-singlefile",
        enforce: "pre", //  pre для обработки ДО плагина билда плейебла

        transformIndexHtml: {
          enforce: "pre",
          transform(html) {
            const locale = gameLocale || "EN";
            const localeData = locales[locale];

            
            const getValue = (path) => {
              return path.split(".").reduce((obj, key) => {
                return obj ? obj[key] : undefined;
              }, localeData);
            };

            // Заменяем плейсхолдеры
            return html.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
              const value = getValue(path);
              return value !== undefined ? value : match;
            });
          },
        },
      },
      viteSingleFile(),
    ],
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
    // server: {
    //   allowedHosts: ["devotedly-lavish-beetle.cloudpub.ru"],
    // },
    define: {
      "import.meta.env.VITE_MODE": JSON.stringify(gameMode),
      "import.meta.env.VITE_LOCALE": JSON.stringify(gameLocale),
    },
  };
});
