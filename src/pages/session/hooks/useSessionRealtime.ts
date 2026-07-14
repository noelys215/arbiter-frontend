import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_WS_BASE } from "../../../lib/api";

type SessionRealtimeMessage = {
  type?: string;
  session_id?: string;
};

const RECONNECT_DELAY_MS = 1500;
const PING_INTERVAL_MS = 25000;

function buildSessionWebSocketUrl(sessionId: string): string {
  return `${API_WS_BASE}/sessions/${encodeURIComponent(sessionId)}/ws`;
}

export function useSessionRealtime(sessionId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;
    let stopped = false;

    const clearTimers = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (pingTimer !== null) {
        window.clearInterval(pingTimer);
        pingTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer !== null) return;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_DELAY_MS);
    };

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(buildSessionWebSocketUrl(sessionId));

      socket.onopen = () => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
        }
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        let message: SessionRealtimeMessage | null = null;
        try {
          message = JSON.parse(String(event.data)) as SessionRealtimeMessage;
        } catch {
          return;
        }

        if (
          message?.type === "session_updated" &&
          message.session_id === sessionId
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["session-state", sessionId],
            exact: true,
          });
        }
      };

      socket.onclose = () => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimers();
      socket?.close();
    };
  }, [queryClient, sessionId]);
}
