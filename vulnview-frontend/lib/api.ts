"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  
  console.log('[apiFetch] Request:', fullUrl, { ...options, headers: Object.fromEntries(headers) });

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[apiFetch] Error:', error, 'Status:', response.status);
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('[apiFetch] Response:', data);
  return data;
}