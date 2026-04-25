import { defineConfig } from "@hey-api/openapi-ts";

const DEFAULT_OPENAPI_URL = "http://localhost:8000/openapi.json";

export default defineConfig({
  input: process.env.OPENAPI_INPUT ?? DEFAULT_OPENAPI_URL,
  output: {
    path: "src/api/generated",
    format: "prettier",
    lint: "eslint",
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "../runtime-config",
    },
    "@hey-api/schemas",
    "@hey-api/sdk",
    "@hey-api/typescript",
  ],
});
