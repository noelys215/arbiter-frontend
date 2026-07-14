import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_WS_BASE } from "../../../lib/api";

type WatchlistRealtimeMessage = {
  type?: string;
  group_id?: string;
};

const RECONNECT_DELAY_MS = 1500;
const PING_INTERVAL_MS = 25000;

function buildWatchlistWebSocketUrl(groupId: string): string {
  return `${API_WS_BASE}/groups/${encodeURIComponent(groupId)}/watchlist/ws`;
}

export function useWatchlistRealtime(groupId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!groupId) return;

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
      socket = new WebSocket(buildWatchlistWebSocketUrl(groupId));

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
        let message: WatchlistRealtimeMessage | null = null;
        try {
          message = JSON.parse(String(event.data)) as WatchlistRealtimeMessage;
        } catch {
          return;
        }

        if (
          message?.type === "watchlist_updated" &&
          message.group_id === groupId
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["watchlist-library", groupId],
          });
          void queryClient.invalidateQueries({
            queryKey: ["watchlist", groupId],
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
  }, [groupId, queryClient]);
}
