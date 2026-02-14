import { FastMCP } from "fastmcp";

export function registerPrompts(server: FastMCP) {
  server.addPrompt({
    name: "invoice_summary",
    description: "Generate a summary of recent invoices from Papierkram",
    arguments: [
      {
        name: "period",
        description: "Time period to summarize (e.g. 'this month', 'last quarter')",
        required: false,
      },
    ],
    load: async ({ period }) => {
      return `Please list and summarize the recent invoices from Papierkram${period ? ` for ${period}` : ""}. Include total amounts, status, and any overdue invoices. Use the list_invoices tool to fetch the data.`;
    },
  });

  server.addPrompt({
    name: "expense_report",
    description: "Generate an expense report from Papierkram data",
    arguments: [
      {
        name: "period",
        description: "Time period for the report",
        required: false,
      },
    ],
    load: async ({ period }) => {
      return `Please create an expense report from Papierkram${period ? ` for ${period}` : ""}. Categorize expenses, show totals by category, and highlight any unusual amounts. Use the list_expense_vouchers tool to fetch the data.`;
    },
  });

  server.addPrompt({
    name: "project_status",
    description: "Get status overview of all active projects",
    arguments: [],
    load: async () => {
      return "Please provide a status overview of all active projects in Papierkram. Include budget utilization, time tracked, and any upcoming deadlines. Use the list_projects and list_time_entries tools.";
    },
  });

  server.addPrompt({
    name: "customer_overview",
    description: "Get an overview of a specific customer including invoices and projects",
    arguments: [
      {
        name: "company_name",
        description: "Name of the customer company",
        required: true,
      },
    ],
    load: async ({ company_name }) => {
      return `Please provide a comprehensive overview of the customer "${company_name}" in Papierkram. Include contact details, all invoices (paid and outstanding), active projects, and total revenue. Use list_companies to find the customer, then get_company, list_invoices, and list_projects.`;
    },
  });
}
