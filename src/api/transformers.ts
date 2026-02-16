/**
 * Compact transformers for list responses.
 * Reduce deeply nested API objects to essential fields for token efficiency.
 */

type AnyRecord = Record<string, unknown>;

/** Pick specified keys from an object */
function pick<T extends AnyRecord>(obj: T, keys: string[]): Partial<T> {
  const result: AnyRecord = {};
  for (const key of keys) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}

// ---- Per-resource compact transformers ----

export function compactCompany(item: AnyRecord): AnyRecord {
  return {
    ...pick(item, ["id", "name", "contact_type", "email"]),
    ...(item.customer_no ? { customer_no: item.customer_no } : {}),
    ...(item.supplier_no ? { supplier_no: item.supplier_no } : {}),
  };
}

export function compactContactPerson(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "first_name", "last_name", "email", "position"]);
}

export function compactInvoice(item: AnyRecord): AnyRecord {
  const billing = item.billing as AnyRecord | undefined;
  return {
    ...pick(item, ["id", "name", "invoice_no", "state", "document_date", "due_date", "total_gross", "customer_no"]),
    ...(billing?.company ? { billing_company: billing.company } : {}),
  };
}

export function compactEstimate(item: AnyRecord): AnyRecord {
  const billing = item.billing as AnyRecord | undefined;
  return {
    ...pick(item, ["id", "name", "estimate_no", "state", "document_date", "total_gross", "customer_no"]),
    ...(billing?.company ? { billing_company: billing.company } : {}),
  };
}

export function compactExpenseVoucher(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "name", "voucher_no", "state", "document_date", "due_date", "amount"]);
}

export function compactProject(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "name", "record_state", "start_date", "end_date", "company_id"]);
}

export function compactTimeEntry(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "started_at", "ended_at", "duration", "comments", "task_id", "project_id"]);
}

export function compactTask(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "name", "complete", "deadline", "project_id"]);
}

export function compactBankConnection(item: AnyRecord): AnyRecord {
  return pick(item, ["id", "name"]);
}

export function compactBankTransaction(item: AnyRecord): AnyRecord {
  const from = item.from as AnyRecord | undefined;
  return {
    ...pick(item, ["id", "value", "state", "bdate", "usage"]),
    ...(from?.name ? { from_name: from.name } : {}),
  };
}

// ---- Generic list response transformer ----

/**
 * Transform a paginated list response by applying a compact function to each entry.
 * Preserves pagination metadata (has_more, page, total_pages, etc.).
 */
export function compactList(
  response: AnyRecord,
  transformer: (item: AnyRecord) => AnyRecord
): AnyRecord {
  const entries = response.entries ?? response.data ?? response;
  if (!Array.isArray(entries)) return response;

  const compacted = entries.map(transformer);

  // Rebuild response with compact entries + pagination metadata
  const result: AnyRecord = {};
  for (const key of Object.keys(response)) {
    if (key === "entries" || key === "data") {
      result[key] = compacted;
    } else {
      result[key] = response[key];
    }
  }
  return result;
}
