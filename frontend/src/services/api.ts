// API Client Wrapper with Token Refresh

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let isRefreshing = false;

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options;

  // Build full URL
  let url = `${API_URL}${path}`;

  // Add query parameters
  if (params) {
    const cleanParams = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "")
      .reduce(
        (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
        {} as Record<string, string>
      );

    const searchParams = new URLSearchParams(cleanParams);

    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  // Auth header
  const token = localStorage.getItem("token");

  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const config: RequestInit = {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...headers,
    },
  };

  let response = await fetch(url, config);

  // Refresh Token
  if (
    response.status === 401 &&
    !isRefreshing &&
    path !== "/api/login" &&
    path !== "/api/refresh"
  ) {
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_URL}/api/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();

          localStorage.setItem("token", data.access_token);
          localStorage.setItem("refreshToken", data.refresh_token);

          isRefreshing = false;

          const retryResponse = await fetch(url, {
            ...config,
            headers: {
              ...(config.headers || {}),
              Authorization: `Bearer ${data.access_token}`,
            },
          });

          response = retryResponse;
        } else {
          isRefreshing = false;
          logoutUser();
        }
      } catch {
        isRefreshing = false;
        logoutUser();
      }
    } else {
      isRefreshing = false;
    }
  }

  // Empty response
  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  // Download files
  const contentType = response.headers.get("Content-Type") || "";

  if (
    contentType.includes("application/pdf") ||
    contentType.includes("text/csv") ||
    contentType.includes("spreadsheet")
  ) {
    return (await response.blob()) as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data as T;
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("role");

  window.location.href = "/login";
}

export const api = {
  login: (credentials: any) =>
    request<any>("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  resetPassword: (payload: any) =>
    request<any>("/api/password-reset", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getDashboard: (params?: any) =>
    request<any>("/api/dashboard", { params }),

  getCustomers: (params: any) =>
    request<any>("/api/customers", { params }),

  getCustomer: (id: number) =>
    request<any>(`/api/customers/${id}`),

  createCustomer: (customer: any) =>
    request<any>("/api/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    }),

  updateCustomer: (id: number, customer: any) =>
    request<any>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    }),

  deleteCustomer: (id: number) =>
    request<any>(`/api/customers/${id}`, {
      method: "DELETE",
    }),

  getCustomerProfile: (id: number) =>
    request<any>(`/api/customers/${id}/profile`),

  addCustomerNote: (id: number, text: string) =>
    request<any>(`/api/customers/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  deleteCustomerNote: (noteId: number) =>
    request<any>(`/api/customers/notes/${noteId}`, {
      method: "DELETE",
    }),

  uploadMockDocument: (
    id: number,
    name: string,
    file_type: string,
    file_size: string
  ) =>
    request<any>(`/api/customers/${id}/documents`, {
      method: "POST",
      body: JSON.stringify({
        name,
        file_type,
        file_size,
      }),
    }),

  deleteMockDocument: (docId: number) =>
    request<any>(`/api/customers/documents/${docId}`, {
      method: "DELETE",
    }),

  updateCustomerTags: (id: number, tags: string[]) =>
    request<any>(`/api/customers/${id}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tags }),
    }),

  predict: (req: any) =>
    request<any>("/api/predict", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  getPredictionHistory: (params: any) =>
    request<any>("/api/predict/history", {
      params,
    }),

  getDiagnostics: () =>
    request<any>("/api/model/diagnostics"),

  getUsers: () =>
    request<any[]>("/api/users"),

  createUser: (user: any) =>
    request<any>("/api/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),

  updateUser: (id: number, user: any) =>
    request<any>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),

  deleteUser: (id: number) =>
    request<any>(`/api/users/${id}`, {
      method: "DELETE",
    }),

  getAuditLogs: (limit = 100) =>
    request<any[]>("/api/users/logs", {
      params: { limit },
    }),

  downloadPortfolioCsv: () =>
    request<Blob>("/api/reports/portfolio/csv"),

  downloadPortfolioExcel: () =>
    request<Blob>("/api/reports/portfolio/excel"),

  downloadPredictionPdf: (predictionId: number) =>
    request<Blob>(
      `/api/reports/prediction/${predictionId}/pdf`
    ),
};