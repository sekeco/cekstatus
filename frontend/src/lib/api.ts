const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ApiOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, params } = options;

  // Build query string
  const queryParams: string[] = [];
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        queryParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
  }
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  const res = await fetch(`${BACKEND_URL}${path}${queryString}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(errorBody.message || res.statusText, res.status);
  }

  return res.json();
}

// ─── Response types ──────────────────────────────────────

export interface ListResponse<T> {
  data: T[];
  total: number;
}

export interface CustomerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  orderCount: number;
  createdAt: string;
}

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerId: string | null;
  label: string | null;
  problemDescription: string;
  estimatedCost: number | null;
  finalCost: number | null;
  priority: string;
  currency: string;
  internalNotes: string | null;
  etaValue: number | null;
  metadata?: Record<string, unknown> | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  currentStatus?: {
    label: string;
    value: string;
    hexColor: string | null;
  } | null;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  label: string | null;
  customerName: string | null;
  customerId: string | null;
  priority: string;
  problemDescription: string;
  createdAt: string;
  currentStatus?: {
    label: string;
    value: string;
    hexColor: string | null;
  } | null;
}

export interface AttachmentResponse {
  id: string;
  url: string;
  filename: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export interface StatusTemplateResponse {
  label: string;
  value: string;
  hexColor: string | null;
}

export interface StatusEventItem {
  id: string;
  label: string;
  value: string;
  hexColor: string | null;
  icon: string | null;
  note: string | null;
  createdAt: string;
}

export interface StatusEventResponse {
  order: OrderResponse;
  event: StatusEventItem;
}

// ─── API ────────────────────────────────────────────────

export const api = {
  // Orders
  orders: {
    list: (
      slug: string,
      q?: { search?: string; status?: string; priority?: string; limit?: number; offset?: number },
    ) => request<ListResponse<OrderResponse>>(`/api/organizations/${slug}/orders`, { params: q }),

    getById: (slug: string, id: string) => request<OrderDetailResponse>(`/api/organizations/${slug}/orders/${id}`),

    getEvents: (slug: string, id: string) =>
      request<StatusEventItem[]>(`/api/organizations/${slug}/orders/${id}/events`),

    create: (slug: string, data: Record<string, unknown>) =>
      request<OrderResponse>(`/api/organizations/${slug}/orders`, { method: "POST", body: data }),

    update: (slug: string, id: string, data: Record<string, unknown>) =>
      request<OrderResponse>(`/api/organizations/${slug}/orders/${id}`, { method: "PATCH", body: data }),

    updateStatus: (slug: string, id: string, data: { status: string; note?: string }) =>
      request<StatusEventResponse>(`/api/organizations/${slug}/orders/${id}/status`, { method: "PATCH", body: data }),

    delete: (slug: string, id: string) =>
      request<{ success: boolean }>(`/api/organizations/${slug}/orders/${id}`, { method: "DELETE" }),
  },

  // Customers
  customers: {
    list: (slug: string, q?: { search?: string; limit?: number; offset?: number }) =>
      request<ListResponse<CustomerResponse>>(`/api/organizations/${slug}/customers`, { params: q }),

    getById: (slug: string, id: string) => request<CustomerResponse>(`/api/organizations/${slug}/customers/${id}`),

    create: (slug: string, data: { name: string; email?: string; phone?: string }) =>
      request<CustomerResponse>(`/api/organizations/${slug}/customers`, { method: "POST", body: data }),

    update: (slug: string, id: string, data: { name?: string; email?: string | null; phone?: string | null }) =>
      request<CustomerResponse>(`/api/organizations/${slug}/customers/${id}`, { method: "PATCH", body: data }),

    delete: (slug: string, id: string) =>
      request<{ success: boolean }>(`/api/organizations/${slug}/customers/${id}`, { method: "DELETE" }),
  },

  // Attachments / Photos
  attachments: {
    list: (slug: string, orderId: string) =>
      request<AttachmentResponse[]>(`/api/organizations/${slug}/orders/${orderId}/attachments`),

    upload: async (slug: string, orderId: string, file: File): Promise<AttachmentResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND_URL}/api/organizations/${slug}/orders/${orderId}/attachments`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ message: res.statusText }));
        throw new ApiError(errorBody.message || res.statusText, res.status);
      }

      return res.json();
    },

    delete: (slug: string, orderId: string, attachmentId: string) =>
      request<{ success: boolean }>(`/api/organizations/${slug}/orders/${orderId}/attachments/${attachmentId}`, {
        method: "DELETE",
      }),
  },

  // Status Templates
  statusTemplates: {
    list: (slug: string) => request<StatusTemplateResponse[]>(`/api/organizations/${slug}/status-templates`),
  },
};
