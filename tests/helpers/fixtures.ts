// API-Response Fixtures fuer Tests

export const fixtures = {
  // ---- Companies ----
  company: {
    id: 100,
    name: "Testfirma GmbH",
    contact_type: "customer",
    email: "info@testfirma.example.com",
    customer_no: "K-001",
    supplier_no: null,
    phone: "+49 30 12345",
    website: "https://testfirma.example.com",
  },

  companyList: {
    entries: [
      { id: 100, name: "Testfirma GmbH", contact_type: "customer", email: "info@testfirma.example.com", customer_no: "K-001", supplier_no: null },
      { id: 101, name: "Lieferant AG", contact_type: "supplier", email: "kontakt@lieferant.example.com", customer_no: null, supplier_no: "L-001" },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  // ---- Contact Persons ----
  contactPerson: {
    id: 200,
    first_name: "Max",
    last_name: "Mustermann",
    email: "max@testfirma.example.com",
    position: "Geschaeftsfuehrer",
    phone: "+49 30 99999",
  },

  contactPersonList: {
    entries: [
      { id: 200, first_name: "Max", last_name: "Mustermann", email: "max@testfirma.example.com", position: "Geschaeftsfuehrer" },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 1,
  },

  // ---- Invoices ----
  invoice: {
    id: 300,
    name: "Testrechnung",
    invoice_no: "RE-2025-001",
    state: "paid",
    document_date: "2025-01-15",
    due_date: "2025-02-15",
    total_gross: "1190.00",
    customer_no: "K-001",
    billing: { company: "Testfirma GmbH", street: "Teststr. 1", zip: "10115", city: "Berlin" },
  },

  invoiceList: {
    entries: [
      {
        id: 300, name: "Testrechnung", invoice_no: "RE-2025-001", state: "paid",
        document_date: "2025-01-15", due_date: "2025-02-15", total_gross: "1190.00",
        customer_no: "K-001", billing: { company: "Testfirma GmbH" },
      },
      {
        id: 301, name: "Entwurf", invoice_no: null, state: "draft",
        document_date: "2025-02-01", due_date: "2025-03-01", total_gross: "595.00",
        customer_no: "K-001", billing: { company: "Testfirma GmbH" },
      },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  // ---- Estimates ----
  estimate: {
    id: 400,
    name: "Testangebot",
    estimate_no: "AN-2025-001",
    state: "accepted",
    document_date: "2025-01-10",
    total_gross: "2380.00",
    customer_no: "K-001",
    billing: { company: "Testfirma GmbH" },
  },

  estimateList: {
    entries: [
      {
        id: 400, name: "Testangebot", estimate_no: "AN-2025-001", state: "accepted",
        document_date: "2025-01-10", total_gross: "2380.00",
        customer_no: "K-001", billing: { company: "Testfirma GmbH" },
      },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 1,
  },

  // ---- Expense Vouchers ----
  expenseVoucher: {
    id: 500,
    name: "Buerokosten Januar",
    voucher_no: "AB-2025-001",
    state: "created",
    document_date: "2025-01-20",
    due_date: "2025-02-20",
    amount: "250.00",
    provenance: "domestic",
  },

  expenseVoucherList: {
    entries: [
      { id: 500, name: "Buerokosten Januar", voucher_no: "AB-2025-001", state: "created", document_date: "2025-01-20", due_date: "2025-02-20", amount: "250.00" },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 1,
  },

  // ---- Projects ----
  project: {
    id: 600,
    name: "Webseite Redesign",
    record_state: "active",
    start_date: "2025-01-01",
    end_date: "2025-06-30",
    company_id: 100,
    description: "Komplettes Redesign der Firmenwebseite",
    default_proposition: { type: "proposition", id: 50, name: "Webentwicklung", article_no: "AN-00050" },
    team_members: [
      { type: "user", id: 1, full_name: "Max Mustermann" },
      { type: "user", id: 2, full_name: "Erika Musterfrau" },
    ],
  },

  projectList: {
    entries: [
      { id: 600, name: "Webseite Redesign", record_state: "active", start_date: "2025-01-01", end_date: "2025-06-30", company_id: 100 },
      { id: 601, name: "App Entwicklung", record_state: "archived", start_date: "2024-06-01", end_date: "2024-12-31", company_id: 101 },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  // ---- Time Entries ----
  timeEntry: {
    id: 700,
    started_at: "2025-01-15T09:00:00+01:00",
    ended_at: "2025-01-15T11:30:00+01:00",
    duration: 9000,
    billable_duration: 9000,
    unbillable: false,
    comments: "Frontend-Entwicklung",
    task_id: 800,
    project_id: 600,
  },

  timeEntryList: {
    entries: [
      { id: 700, started_at: "2025-01-15T09:00:00+01:00", ended_at: "2025-01-15T11:30:00+01:00", duration: 9000, comments: "Frontend-Entwicklung", task_id: 800, project_id: 600 },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 1,
  },

  // ---- Tasks ----
  task: {
    id: 800,
    name: "Header implementieren",
    complete: "75",
    deadline: "2025-03-01",
    project_id: 600,
    flagged: false,
  },

  taskList: {
    entries: [
      { id: 800, name: "Header implementieren", complete: "75", deadline: "2025-03-01", project_id: 600 },
      { id: 801, name: "Footer implementieren", complete: "0", deadline: "2025-04-01", project_id: 600 },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  // ---- Banking ----
  bankConnection: {
    id: 900,
    name: "Geschaeftskonto Sparkasse",
  },

  bankConnectionList: {
    entries: [
      { id: 900, name: "Geschaeftskonto Sparkasse" },
      { id: 901, name: "Tagesgeldkonto" },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  bankTransaction: {
    id: 1000,
    value: "-150.00",
    state: "imported",
    bdate: "2025-01-18",
    usage: "Buerobedarf Amazon",
    from: { name: "Amazon EU S.a.r.l." },
  },

  bankTransactionList: {
    entries: [
      { id: 1000, value: "-150.00", state: "imported", bdate: "2025-01-18", usage: "Buerobedarf Amazon", from: { name: "Amazon EU S.a.r.l." } },
      { id: 1001, value: "1190.00", state: "matched", bdate: "2025-01-20", usage: "Zahlung RE-2025-001", from: { name: "Testfirma GmbH" } },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 2,
  },

  // ---- Info ----
  accountInfo: {
    company: "Wagner-Emden IT Services",
    plan: "professional",
    subscription: { status: "active", period_end: "2026-01-01" },
  },

  paymentTermList: {
    entries: [
      { id: 1, name: "Sofort faellig", days: 0 },
      { id: 2, name: "14 Tage netto", days: 14 },
      { id: 3, name: "30 Tage netto", days: 30 },
    ],
    has_more: false,
    page: 1,
    total_pages: 1,
    total_entries: 3,
  },

  // Listenformat laut Swagger-Beispiel zu GET /income/propositions (synthetische Werte).
  propositionList: {
    type: "list",
    page: 1,
    page_size: 25,
    total_pages: 1,
    total_entries: 2,
    has_more: false,
    entries: [
      {
        type: "proposition",
        id: 50,
        name: "Webentwicklung",
        article_no: "AN-00050",
        proposition_type: "service",
        description: "Frontend- und Backend-Entwicklung",
        price: "120.0",
        time_unit: "hour",
        unit_name_1: "Stunde",
        unit_name_n: "Stunden",
        record_state: "active",
        flagged: null,
        favorite: null,
        created_at: "2025-01-15T09:00:00.000+01:00",
        updated_at: "2025-01-15T09:00:00.000+01:00",
      },
      {
        type: "proposition",
        id: 51,
        name: "Beratung",
        article_no: "AN-00051",
        proposition_type: "service",
        description: "",
        price: "150.0",
        time_unit: "hour",
        unit_name_1: "Stunde",
        unit_name_n: "Stunden",
        record_state: "active",
        flagged: null,
        favorite: null,
        created_at: "2025-01-16T09:00:00.000+01:00",
        updated_at: "2025-01-16T09:00:00.000+01:00",
      },
    ],
  },

  // Einzelformat laut Swagger-Beispiel zu GET /income/propositions/{id} (synthetische Werte).
  proposition: {
    type: "proposition",
    id: 50,
    name: "Webentwicklung",
    article_no: "AN-00050",
    proposition_type: "service",
    description: "Frontend- und Backend-Entwicklung",
    price: "120.0",
    time_unit: "hour",
    unit_name_1: "Stunde",
    unit_name_n: "Stunden",
    record_state: "active",
    flagged: null,
    favorite: null,
    created_at: "2025-01-15T09:00:00.000+01:00",
    updated_at: "2025-01-15T09:00:00.000+01:00",
    vat_rate: {
      type: "vat_rate",
      id: 1,
      name: "19%",
      rate: "0.19",
      description: "Regelsteuersatz",
      code: "AR19P",
      country_code: "de",
      vat_rate_type: "ar",
      created_at: "2025-01-01T00:00:00.000+01:00",
      updated_at: "2025-01-01T00:00:00.000+01:00",
    },
  },

  // ---- Users ----
  // Format laut Swagger-Beispielen zu GET /users und GET /users/{id} (synthetische Werte).
  user: {
    type: "user",
    id: 1,
    full_name: "Max Mustermann",
    first_name: "Max",
    last_name: "Mustermann",
    role: "owner",
    role_f: "Accountinhaber",
    email: "max@testfirma.example.com",
  },

  userList: {
    type: "list",
    page: 1,
    page_size: 25,
    total_pages: 1,
    total_entries: 2,
    has_more: false,
    entries: [
      {
        type: "user",
        id: 1,
        full_name: "Max Mustermann",
        first_name: "Max",
        last_name: "Mustermann",
        role: "owner",
        role_f: "Accountinhaber",
        email: "max@testfirma.example.com",
      },
      {
        type: "user",
        id: 2,
        full_name: "Erika Musterfrau",
        first_name: "Erika",
        last_name: "Musterfrau",
        role: "tracker",
        role_f: "Zeiterfasser",
        email: "erika@testfirma.example.com",
      },
    ],
  },
};
