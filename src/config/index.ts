export interface Config {
  apiKey: string;
  subdomain: string;
  port: number;
}

export function loadConfig(): Config {
  const apiKey = process.env.PAPIERKRAM_API_KEY;
  const subdomain = process.env.PAPIERKRAM_SUBDOMAIN;

  if (!apiKey) {
    throw new Error("PAPIERKRAM_API_KEY environment variable is required");
  }
  if (!subdomain) {
    throw new Error("PAPIERKRAM_SUBDOMAIN environment variable is required");
  }

  return {
    apiKey,
    subdomain,
    port: parseInt(process.env.PORT || "3001", 10),
  };
}
