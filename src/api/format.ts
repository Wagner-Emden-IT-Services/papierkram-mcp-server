/**
 * Response-size guardrails for tool output.
 *
 * Tools serialize API results to JSON. Large responses (compact=false, big
 * single records, long reference lists) can overwhelm the model context, so
 * every JSON tool result is routed through `toToolJson`, which truncates
 * oversized list responses (halving entries until they fit) and otherwise
 * returns a bounded notice. Normal-sized responses are returned unchanged.
 */
export const CHARACTER_LIMIT = 25000;

export function toToolJson(value: unknown): string {
  // A 2xx response without a payload (204 No Content, or an endpoint that simply
  // answers empty) arrives here as undefined/null. JSON.stringify(undefined) is
  // the value undefined, not a string, so the length check below would throw for
  // an operation that in fact succeeded.
  if (value === undefined || value === null) {
    return JSON.stringify(
      {
        success: true,
        message: "The operation succeeded. The API returned an empty response body.",
      },
      null,
      2
    );
  }

  const json = JSON.stringify(value, null, 2);
  if (json.length <= CHARACTER_LIMIT) return json;

  // Oversized list response: keep halving the entries until it fits.
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const listKey = Array.isArray(record.entries)
      ? "entries"
      : Array.isArray(record.data)
        ? "data"
        : null;
    if (listKey) {
      const items = record[listKey] as unknown[];
      let keep = items.length;
      while (keep > 1) {
        keep = Math.floor(keep / 2);
        const candidate = {
          ...record,
          [listKey]: items.slice(0, keep),
          truncated: true,
          truncation_message:
            `Response truncated from ${items.length} to ${keep} items (exceeded ${CHARACTER_LIMIT} characters). ` +
            `Narrow the result with page_size, filters, or pagination.`,
        };
        const serialized = JSON.stringify(candidate, null, 2);
        if (serialized.length <= CHARACTER_LIMIT) return serialized;
      }
    }
  }

  // Non-list payload (or a single item still too large): bounded notice.
  return JSON.stringify(
    {
      truncated: true,
      truncation_message:
        `Response exceeded ${CHARACTER_LIMIT} characters and was truncated. ` +
        `Request a single record, fewer fields, or use compact/pagination.`,
      preview: json.slice(0, CHARACTER_LIMIT),
    },
    null,
    2
  );
}
