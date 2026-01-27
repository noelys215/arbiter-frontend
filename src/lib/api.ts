const DEFAULT_API_BASE = "http://localhost:8000";

export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? DEFAULT_API_BASE;

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
  });

  return response;
}
