import { cloudflare } from "@cloudflare/vite-plugin";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isFreshBootstrap = mode === "fresh";
  const isLocalDevelopment = mode === "development";
  const isCloudflareBuild = mode === "cloudflare" || mode === "production";
  const useLocalAssets = isFreshBootstrap || isLocalDevelopment;

  return {
    resolve: useLocalAssets
      ? {
        alias: {
          "cloudflare:workers":
            new URL("./src/cloudflare-stub.ts", import.meta.url).pathname,
        },
      }
      : undefined,
    plugins: [
      fresh({
        serverEntry: "./src/main.ts",
        clientEntry: "./src/client.ts",
        islandsDir: "./src/islands",
        routeDir: "./src/routes",
        staticDir: "./static",
      }),
      tailwindcss(),
      ...(isCloudflareBuild
        ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
        : []),
    ],
  };
});
