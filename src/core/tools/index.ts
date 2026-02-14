import { FastMCP } from "fastmcp";
import { registerContactTools } from "./contacts.js";
import { registerInvoiceTools } from "./invoices.js";
import { registerEstimateTools } from "./estimates.js";
import { registerExpenseTools } from "./expenses.js";
import { registerBankingTools } from "./banking.js";
import { registerProjectTools } from "./projects.js";
import { registerTrackerTools } from "./tracker.js";
import { registerInfoTools } from "./info.js";

export function registerTools(server: FastMCP) {
  registerContactTools(server);
  registerInvoiceTools(server);
  registerEstimateTools(server);
  registerExpenseTools(server);
  registerBankingTools(server);
  registerProjectTools(server);
  registerTrackerTools(server);
  registerInfoTools(server);
}
