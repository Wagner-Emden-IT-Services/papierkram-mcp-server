export interface Config {
  apiKey: string;
  subdomain: string;
  port: number;
}

export function loadConfig(): Config {
  const apiKey = process.env.PAPIERKRAM_API_KEY;
  const subdomain = process.env.PAPIERKRAM_SUBDOMAIN;

  if (!apiKey) {
    throw new Error(
      "PAPIERKRAM_API_KEY environment variable is required. Create an API key in Papierkram under Einstellungen → API."
    );
  }
  if (!subdomain) {
    throw new Error(
      "PAPIERKRAM_SUBDOMAIN environment variable is required. It is the '<subdomain>' in https://<subdomain>.papierkram.de."
    );
  }

  const port = parseInt(process.env.PORT || "3001", 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid PORT '${process.env.PORT}': must be an integer between 1 and 65535.`
    );
  }

  return { apiKey, subdomain, port };
}
