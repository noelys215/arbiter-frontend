const AUTH_HANDOFF_STORAGE_KEY = "arbiter:auth-handoff";
const AUTH_HANDOFF_CHANNEL = "arbiter-auth-handoff";

type AuthHandoffMessage = {
  type: "auth-success";
  source: string;
  nonce: string;
  at: number;
};

function randomNonce() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAuthSuccessMessage(value: unknown): value is AuthHandoffMessage {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    (value as { type?: unknown }).type === "auth-success"
  );
}

export function broadcastAuthSuccess(source: string) {
  const message: AuthHandoffMessage = {
    type: "auth-success",
    source,
    nonce: randomNonce(),
    at: Date.now(),
  };

  try {
    window.localStorage.setItem(AUTH_HANDOFF_STORAGE_KEY, JSON.stringify(message));
  } catch {
    // localStorage may be unavailable in some browser modes.
  }

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(AUTH_HANDOFF_CHANNEL);
    channel.postMessage(message);
    channel.close();
  }
}

export function subscribeToAuthSuccess(onSuccess: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_HANDOFF_STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as unknown;
      if (isAuthSuccessMessage(parsed)) {
        onSuccess();
      }
    } catch {
      // Ignore malformed payloads.
    }
  };

  window.addEventListener("storage", onStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(AUTH_HANDOFF_CHANNEL);
    channel.onmessage = (event) => {
      if (isAuthSuccessMessage(event.data)) {
        onSuccess();
      }
    };
  }

  return () => {
    window.removeEventListener("storage", onStorage);
    if (channel) {
      channel.close();
    }
  };
}
