/**
 * Shared ERPNext API client.
 * All ERPNext calls go through this module — single source for auth + URL config.
 */

const ERPNEXT_URL = process.env.ERPNEXT_URL ?? "http://192.168.1.33:8080";
const ERPNEXT_KEY = process.env.ERPNEXT_API_KEY ?? "";
const ERPNEXT_SECRET = process.env.ERPNEXT_API_SECRET ?? "";

export const erpHeaders = {
  Authorization: `token ${ERPNEXT_KEY}:${ERPNEXT_SECRET}`,
  "Content-Type": "application/json",
};

export function erpUrl(path: string): string {
  return `${ERPNEXT_URL}${path}`;
}

export async function erpGet<T = Record<string, unknown>>(
  doctype: string,
  nameOrFilters?: string,
  fields?: string[]
): Promise<T | null> {
  const isFilter = nameOrFilters?.startsWith("[");
  const params = new URLSearchParams();
  if (isFilter && nameOrFilters) params.set("filters", nameOrFilters);
  if (fields) params.set("fields", JSON.stringify(fields));
  params.set("limit_page_length", "100");

  const path = isFilter
    ? `/api/resource/${doctype}?${params}`
    : `/api/resource/${doctype}/${nameOrFilters || ""}?${params}`;

  const r = await fetch(erpUrl(path), { headers: erpHeaders });
  if (!r.ok) return null;
  const json = await r.json();
  return json.data ?? null;
}

export async function erpPost(
  doctype: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const r = await fetch(erpUrl(`/api/resource/${doctype}`), {
    method: "POST",
    headers: erpHeaders,
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.exception || `ERPNext ${r.status}`);
  }
  return (await r.json()).data;
}

export async function erpPut(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const r = await fetch(erpUrl(`/api/resource/${doctype}/${name}`), {
    method: "PUT",
    headers: erpHeaders,
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.exception || `ERPNext ${r.status}`);
  }
  return (await r.json()).data;
}

// App config constants — centralized
export const APP_CONFIG = {
  company: process.env.COMPANY_NAME ?? "Northstar Systems LLC",
  costCenter: process.env.PRIMARY_COST_CENTER ?? "3D Printing - NSS",
  erpDomain: process.env.ERPNEXT_DOMAIN ?? "erp.northstarsystems.duckdns.org",
  printerCost: parseFloat(process.env.PRINTER_COST ?? "560"),
  printerCostDate: process.env.PRINTER_COST_DATE ?? "2026-04-15",
  printerSerial: process.env.PRINTER_SERIAL ?? "01P00C5C3003346",
  printerIP: process.env.PRINTER_IP ?? "192.168.1.74",
};
