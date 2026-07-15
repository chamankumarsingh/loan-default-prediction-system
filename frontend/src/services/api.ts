// Upgraded API Client Wrapper with Token Refresh and CRM endpoints

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Global flag to prevent infinite loops in retries
let isRefreshing = false;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;
  
  // 1. Build URL with query params
  let url = path;
  if (params) {
    const cleanParams = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>);
      
    const searchParams = new URLSearchParams(cleanParams);
    url += `?${searchParams.toString()}`;
  }

  // 2. Add auth header
  const token = localStorage.getItem('token');
  const authHeader: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

  // 3. Configure request
  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...headers,
    },
  };

  // 4. Perform call
  let response = await fetch(url, config);

  // 5. Handle Token Expired (401 Unauthorized) - Refresh Token Rotation Interceptor
  if (response.status === 401 && !isRefreshing && path !== '/api/login' && path !== '/api/refresh') {
    isRefreshing = true;
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch('/api/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Update tokens in local storage
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);
          
          isRefreshing = false;
          // Retry original request with new token
          const retryHeader = { 'Authorization': `Bearer ${data.access_token}` };
          const retryConfig = {
            ...rest,
            headers: {
              'Content-Type': 'application/json',
              ...retryHeader,
              ...headers,
            }
          };
          response = await fetch(url, retryConfig);
        } else {
          // Refresh token expired or invalid -> log out
          isRefreshing = false;
          logoutUser();
        }
      } catch (err) {
        isRefreshing = false;
        logoutUser();
      }
    } else {
      isRefreshing = false;
    }
  }

  // 6. Handle empty responses
  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  // 7. Handle file downloads
  const contentType = response.headers.get('Content-Type') || '';
  if (
    contentType.includes('application/pdf') || 
    contentType.includes('text/csv') || 
    contentType.includes('spreadsheet')
  ) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.detail || 'Something went wrong';
    throw new Error(errorMsg);
  }

  return data as T;
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  window.location.href = '/login';
}

export const api = {
  // Authentication
  login: (credentials: any) => 
    request<any>('/api/login', { method: 'POST', body: JSON.stringify(credentials) }),
    
  resetPassword: (payload: { username: string, email: string }) =>
    request<any>('/api/password-reset', { method: 'POST', body: JSON.stringify(payload) }),
  
  // Dashboard
  getDashboard: (params?: any) => 
    request<any>('/api/dashboard', { params }),
  
  // Customers CRUD
  getCustomers: (params: any) => 
    request<any>('/api/customers', { params }),
  
  getCustomer: (id: number) => 
    request<any>(`/api/customers/${id}`),
  
  createCustomer: (customer: any) => 
    request<any>('/api/customers', { method: 'POST', body: JSON.stringify(customer) }),
  
  updateCustomer: (id: number, customer: any) => 
    request<any>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(customer) }),
  
  deleteCustomer: (id: number) => 
    request<any>(`/api/customers/${id}`, { method: 'DELETE' }),

  // CRM Workspace / Profile Page
  getCustomerProfile: (id: number) => 
    request<any>(`/api/customers/${id}/profile`),
    
  addCustomerNote: (id: number, text: string) => 
    request<any>(`/api/customers/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) }),
    
  deleteCustomerNote: (noteId: number) => 
    request<any>(`/api/customers/notes/${noteId}`, { method: 'DELETE' }),
    
  uploadMockDocument: (id: number, name: string, file_type: string, file_size: string) => 
    request<any>(`/api/customers/${id}/documents`, { method: 'POST', body: JSON.stringify({ name, file_type, file_size }) }),
    
  deleteMockDocument: (docId: number) => 
    request<any>(`/api/customers/documents/${docId}`, { method: 'DELETE' }),
    
  updateCustomerTags: (id: number, tags: string[]) => 
    request<any>(`/api/customers/${id}/tags`, { method: 'PUT', body: JSON.stringify({ tags }) }),

  // Predictions
  predict: (req: any) => 
    request<any>('/api/predict', { method: 'POST', body: JSON.stringify(req) }),
  
  getPredictionHistory: (params: any) => 
    request<any>('/api/predict/history', { params }),

  // Model Diagnostics
  getDiagnostics: () => 
    request<any>('/api/model/diagnostics'),

  // User Administration (Admin Panel)
  getUsers: () => 
    request<any[]>('/api/users'),
  
  createUser: (user: any) => 
    request<any>('/api/users', { method: 'POST', body: JSON.stringify(user) }),
  
  updateUser: (id: number, user: any) => 
    request<any>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  
  deleteUser: (id: number) => 
    request<any>(`/api/users/${id}`, { method: 'DELETE' }),
  
  getAuditLogs: (limit = 100) => 
    request<any[]>('/api/users/logs', { params: { limit } }),

  // Reports downloads
  downloadPortfolioCsv: () => 
    request<Blob>('/api/reports/portfolio/csv'),
  
  downloadPortfolioExcel: () => 
    request<Blob>('/api/reports/portfolio/excel'),
  
  downloadPredictionPdf: (predictionId: number) => 
    request<Blob>(`/api/reports/prediction/${predictionId}/pdf`),
};
