const DEFAULT_API_BASE = "http://localhost:8000";
const RAW_API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const IS_LOCAL_DEV = Boolean(import.meta.env.DEV);

export const API_BASE =
  IS_LOCAL_DEV ? DEFAULT_API_BASE : (RAW_API_BASE || DEFAULT_API_BASE);

export const API_WS_BASE = API_BASE.replace(/^http/i, (protocol) =>
  protocol.toLowerCase() === "https" ? "wss" : "ws",
);

type ApiOptions = RequestInit & { signal?: AbortSignal };
type ApiErrorShape = Error & { status?: number; detail?: string };

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
    let detail: string | undefined;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        const payload = (await response.json()) as
          | { detail?: unknown; message?: unknown }
          | null;
        if (typeof payload?.detail === "string" && payload.detail.trim()) {
          detail = payload.detail.trim();
        } else if (
          typeof payload?.message === "string" &&
          payload.message.trim()
        ) {
          detail = payload.message.trim();
        }
      } catch {
        detail = undefined;
      }
    } else {
      try {
        const text = await response.text();
        if (text.trim()) detail = text.trim();
      } catch {
        detail = undefined;
      }
    }

    const error = new Error(
      detail || `Request failed (${response.status})`,
    ) as ApiErrorShape;
    error.detail = detail;
    error.status = response.status;
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
