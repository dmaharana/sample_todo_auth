const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T>(endpoint: string, method: string, data?: any): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    if (!response.ok) {
      return { error: responseData.error || 'Something went wrong' };
    }

    return { data: responseData };
  } catch (error: any) {
    return { error: error.message || 'Network error' };
  }
}
