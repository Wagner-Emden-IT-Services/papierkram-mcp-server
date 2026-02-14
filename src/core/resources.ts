import { FastMCP } from "fastmcp";
import { getClient } from "../api/client.js";

export function registerResources(server: FastMCP) {
  // Company resource
  server.addResourceTemplate({
    uriTemplate: "papierkram://company/{id}",
    name: "Papierkram Company",
    mimeType: "application/json",
    arguments: [
      {
        name: "id",
        description: "Company ID",
        required: true,
      },
    ],
    async load({ id }) {
      const client = getClient();
      const company = await client.get(`/contact/companies/${id}`);
      return { text: JSON.stringify(company, null, 2) };
    },
  });

  // Invoice resource
  server.addResourceTemplate({
    uriTemplate: "papierkram://invoice/{id}",
    name: "Papierkram Invoice",
    mimeType: "application/json",
    arguments: [
      {
        name: "id",
        description: "Invoice ID",
        required: true,
      },
    ],
    async load({ id }) {
      const client = getClient();
      const invoice = await client.get(`/income/invoices/${id}`);
      return { text: JSON.stringify(invoice, null, 2) };
    },
  });

  // Project resource
  server.addResourceTemplate({
    uriTemplate: "papierkram://project/{id}",
    name: "Papierkram Project",
    mimeType: "application/json",
    arguments: [
      {
        name: "id",
        description: "Project ID",
        required: true,
      },
    ],
    async load({ id }) {
      const client = getClient();
      const project = await client.get(`/projects/${id}`);
      return { text: JSON.stringify(project, null, 2) };
    },
  });
}
