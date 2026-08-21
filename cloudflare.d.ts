interface AssetFetcher {
  fetch(input: Request | URL | string): Promise<Response>;
}

interface WorkerEnv {
  ASSETS: AssetFetcher;
}

declare module "cloudflare:workers" {
  export const env: WorkerEnv;
}
