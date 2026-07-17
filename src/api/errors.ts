import { UserError } from "fastmcp";

/**
 * Maps Papierkram HTTP errors to concise, actionable user-facing errors.
 * The raw upstream body is stripped of markup and truncated so internal
 * details / stack traces are not echoed verbatim into the model context.
 */
const MAX_ERROR_BODY = 600;

function trimBody(body: string): string {
  const stripped = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return "";
  return stripped.length > MAX_ERROR_BODY ? `${stripped.slice(0, MAX_ERROR_BODY)}…` : stripped;
}

export function mapApiError(
  status: number,
  statusText: string,
  body: string,
  retryAfter?: string | null
): UserError {
  const detail = trimBody(body);
  const withDetail = (msg: string) => (detail ? `${msg} Details: ${detail}` : msg);

  switch (status) {
    case 400:
    case 422:
      return new UserError(
        withDetail(
          `Papierkram rejected the request (${status}). Check required fields and value formats (e.g. dates YYYY-MM-DD, vat_rate as 0.19).`
        )
      );
    case 401:
      return new UserError(
        "Papierkram authentication failed (401). Verify PAPIERKRAM_API_KEY (Papierkram → Einstellungen → API)."
      );
    case 403:
      return new UserError(
        "Papierkram denied access (403). The API key lacks permission for this resource."
      );
    case 404:
      return new UserError(
        "Papierkram resource not found (404). Verify the ID exists and belongs to this account."
      );
    case 429:
      return new UserError(
        `Papierkram rate limit exceeded (429).${retryAfter ? ` Retry after ${retryAfter}s.` : ""} Wait before retrying.`
      );
    default:
      if (status >= 500) {
        return new UserError(
          withDetail(`Papierkram server error (${status}). This is usually temporary; try again shortly.`)
        );
      }
      return new UserError(withDetail(`Papierkram API error ${status} ${statusText}.`));
  }
}

/** Translates fetch/network failures (timeout, DNS, connection) into user-facing errors. */
export function networkError(err: unknown): UserError {
  if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
    return new UserError("Papierkram request timed out. The API did not respond in time; please try again.");
  }
  return new UserError(
    `Could not reach Papierkram: ${err instanceof Error ? err.message : String(err)}`
  );
}
