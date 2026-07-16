import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REALTIME_RECONNECT_DELAY_MS } from "./realtimeSocket";
import { useAccountRealtime } from "./useAccountRealtime";

const getMeMock = vi.fn(async () => ({ id: "me" }));

vi.mock("../auth/auth.api", () => ({
  getMe: () => getMeMock(),
}));

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send() {}
  close() {}
}

function Harness() {
  useAccountRealtime(true);
  return null;
}

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  );
}

describe("useAccountRealtime reconnect behavior", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("reconnects after an ordinary dropped connection", async () => {
    renderHarness();
    expect(MockWebSocket.instances).toHaveLength(1);

    MockWebSocket.instances[0].onclose?.({ code: 1006 } as CloseEvent);
    await vi.runAllTicks();
    vi.advanceTimersByTime(REALTIME_RECONNECT_DELAY_MS);

    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it("does not reconnect after an authorization close", () => {
    renderHarness();
    MockWebSocket.instances[0].onclose?.({ code: 1008 } as CloseEvent);
    vi.advanceTimersByTime(REALTIME_RECONNECT_DELAY_MS * 2);

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("stops after an abnormal handshake close confirms an expired login", async () => {
    const authError = Object.assign(new Error("Not authenticated"), {
      status: 401,
    });
    getMeMock.mockRejectedValueOnce(authError);
    renderHarness();

    MockWebSocket.instances[0].onclose?.({ code: 1006 } as CloseEvent);
    await vi.runAllTicks();
    vi.advanceTimersByTime(REALTIME_RECONNECT_DELAY_MS * 2);

    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
