const DEFAULT_API_BASE = "http://localhost:8000";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_BASE;

type ApiOptions = RequestInit & { signal?: AbortSignal };

export async function api(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  return response;
}

export async function apiJson<T>(path: string, options: ApiOptions = {}) {
  const response = await api(path, options);
  if (!response.ok) {
    const error = new Error("Request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export function jsonBody(payload: unknown) {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}
