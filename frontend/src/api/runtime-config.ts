import type { CreateClientConfig } from "./generated/client.gen";

const DEFAULT_BASE_URL = "http://localhost:8000";

const resolveBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_BASE_URL
    );
  }
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
};

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: resolveBaseUrl(),
});
