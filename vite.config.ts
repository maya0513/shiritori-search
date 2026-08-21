import { cloudflare } from "@cloudflare/vite-plugin";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isLocalDevelopment = mode === "development";

  return {
    resolve: isLocalDevelopment
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
      cloudflare({ viteEnvironment: { name: "ssr" } }),
    ],
  };
});
