import { defineConfig } from "vite";

export default defineConfig({
  build: { target: "es2022", rollupOptions: { input: ["index.html", "dev.html"] } },
  // the background export rewrites public/data; don't reload the page mid-run when it does
  server: { watch: { ignored: ["**/public/data/**"] } },
});
