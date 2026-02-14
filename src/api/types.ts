// ---- Pagination ----
export interface PaginatedResponse<T> {
  entries: T[];
  has_more: boolean;
  page: number;
  page_size: number;
  total_entries: number;
  total_pages: number;
}

// ---- Contacts ----
export interface Company {
  id: number;
  name: string;
  contact_type: "customer" | "supplier";
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  twitter?: string;
  ust_idnr?: string;
  note?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactPerson {
  id: number;
  first_name: string;
  last_name: string;
  title?: string;
  salutation?: string;
  position?: string;
  department?: string;
  phone?: string;
  skype?: string;
  fax?: string;
  email?: string;
  flagged?: boolean;
  mobile?: string;
  comment?: string;
  default?: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Line Items ----
export interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  price: number;
  vat_rate: string;
  category?: string;
}

// ---- Invoices ----
export interface Invoice {
  id: number;
  name: string;
  state: string;
  invoice_number?: string;
  invoice_date?: string;
  supply_date?: string;
  due_date?: string;
  customer_no?: string;
  billing?: object;
  total_net: number;
  total_gross: number;
  total_vat: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// ---- Estimates ----
export interface Estimate {
  id: number;
  name: string;
  state: string;
  estimate_number?: string;
  estimate_date?: string;
  description?: string;
  total_net: number;
  total_gross: number;
  total_vat: number;
  created_at: string;
  updated_at: string;
}

// ---- Expenses ----
export interface ExpenseVoucher {
  id: number;
  name: string;
  state: string;
  voucher_date?: string;
  due_date?: string;
  description?: string;
  entertainment_reason?: string;
  total_net: number;
  total_gross: number;
  total_vat: number;
  creditor?: string;
  created_at: string;
  updated_at: string;
}

// ---- Banking ----
export interface BankConnection {
  id: number;
  name: string;
  account_no?: string;
  bic?: string;
  blz?: string;
  iban?: string;
  connection_type?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: number;
  value: number;
  transaction_type?: string;
  state: string;
  from?: string;
  subject?: string;
  booking_date?: string;
  value_date?: string;
  created_at: string;
  updated_at: string;
}

// ---- Projects ----
export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  state: string;
  color?: string;
  budget_type?: string;
  budget_money?: number;
  budget_time?: number;
  budget_time_unit?: string;
  created_at: string;
  updated_at: string;
}

// ---- Tracker ----
export interface Task {
  id: number;
  name: string;
  state: string;
  relative_costs?: number;
  complete?: number;
  deadline?: string;
  flagged?: boolean;
  proposition?: object;
  project?: object;
  user?: object;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: number;
  comments?: string;
  started_at: string;
  ended_at: string;
  duration: number;
  unbillable?: boolean;
  billable_duration?: number;
  user?: object;
  task?: object;
  project?: object;
  created_at: string;
  updated_at: string;
}

// ---- Info ----
export interface AccountInfo {
  company: string;
  plan?: string;
  email?: string;
  subscription?: object;
  [key: string]: unknown;
}
