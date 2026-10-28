import { useAuthStore } from '../store/auth.store';

const BASE_URL = '/api';
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  useAuthStore.getState().setAccessToken(data.accessToken);
  return data.accessToken;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // 401 → attempt token refresh
  if (res.status === 401) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: async (token) => {
            const retryRes = await fetch(`${BASE_URL}${path}`, {
              ...options,
              headers: { ...headers, Authorization: `Bearer ${token}` },
              credentials: 'include',
            });
            if (!retryRes.ok) reject(new Error('Request failed'));
            else resolve(await retryRes.json());
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      isRefreshing = false;

      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        credentials: 'include',
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: 'Request failed' }));
        throw Object.assign(new Error(err.message || 'Request failed'), { status: retryRes.status });
      }
      return retryRes.json();
    } catch (err) {
      processQueue(err as Error, null);
      isRefreshing = false;
      useAuthStore.getState().clearAuth();
      throw err;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status });
  }

  return res.json();
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: import('@training-platform/shared-types').User }>(
      '/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  register: (data: { email: string; password: string; role?: string; department_id?: string; manager_id?: string }) =>
    apiFetch<{ accessToken: string; user: import('@training-platform/shared-types').User }>(
      '/auth/register', { method: 'POST', body: JSON.stringify(data) }
    ),
  logout: () => fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' }),
};

// Typed convenience functions
export const coursesApi = {
  list: () => apiFetch<import('@training-platform/shared-types').Course[]>('/courses'),
  getById: (id: string) => apiFetch<import('@training-platform/shared-types').Course>(`/courses/${id}`),
  create: (data: import('@training-platform/shared-types').CreateCourseInput) =>
    apiFetch<import('@training-platform/shared-types').Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
};

export const sessionsApi = {
  list: (courseId: string) => apiFetch<import('@training-platform/shared-types').Session[]>(`/sessions?course_id=${courseId}`),
  create: (courseId: string, data: import('@training-platform/shared-types').CreateSessionInput) =>
    apiFetch<import('@training-platform/shared-types').Session>(`/sessions/${courseId}`, { method: 'POST', body: JSON.stringify(data) }),
};

export const enrollmentsApi = {
  getMyEnrollments: () => apiFetch<import('@training-platform/shared-types').Enrollment[]>('/enrollments/me'),
  enroll: (data: import('@training-platform/shared-types').CreateEnrollmentInput) =>
    apiFetch<import('@training-platform/shared-types').Enrollment>('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  complete: (id: string) =>
    apiFetch<import('@training-platform/shared-types').Enrollment>(`/enrollments/${id}/complete`, { method: 'PATCH' }),
  drop: (id: string) =>
    apiFetch<import('@training-platform/shared-types').Enrollment>(`/enrollments/${id}/drop`, { method: 'PATCH' }),
};

export const assessmentsApi = {
  list: () =>
    apiFetch<Array<import('@training-platform/shared-types').Assessment & { course_title: string; course_category: string | null }>>('/assessments'),
  submit: (id: string, score: number) =>
    apiFetch<import('@training-platform/shared-types').AssessmentResult>(`/assessments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
  getResults: (id: string) =>
    apiFetch<import('@training-platform/shared-types').AssessmentResult[]>(`/assessments/${id}/results`),
};

export const certificationsApi = {
  getMyCerts: () => apiFetch<import('@training-platform/shared-types').Certification[]>('/certifications/me'),
  getByStatus: (status?: string) =>
    apiFetch<import('@training-platform/shared-types').Certification[]>(`/certifications${status ? `?status=${status}` : ''}`),
  revoke: (id: string) =>
    apiFetch<import('@training-platform/shared-types').Certification>(`/certifications/${id}/revoke`, { method: 'POST' }),
};

export const reportsApi = {
  compliance: (departmentId?: string) =>
    apiFetch<import('@training-platform/shared-types').ComplianceRow[]>(
      `/reports/compliance${departmentId ? `?department_id=${departmentId}` : ''}`
    ),
};

export const departmentsApi = {
  list: () => apiFetch<import('@training-platform/shared-types').Department[]>('/departments'),
};

export const usersApi = {
  me: () => apiFetch<import('@training-platform/shared-types').User>('/users/me'),
  list: () => apiFetch<import('@training-platform/shared-types').User[]>('/users'),
};
