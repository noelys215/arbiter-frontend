import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { API_WS_BASE } from "../../lib/api";
import { getMe } from "../auth/auth.api";
import {
  invalidateAccountQueries,
  type AccountRealtimeMessage,
} from "./accountRealtime";
import {
  REALTIME_PING_INTERVAL_MS,
  REALTIME_RECONNECT_DELAY_MS,
  shouldReconnectRealtimeSocket,
} from "./realtimeSocket";

export function useAccountRealtime(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

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
      }, REALTIME_RECONNECT_DELAY_MS);
    };

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(`${API_WS_BASE}/me/ws`);

      socket.onopen = () => {
        if (pingTimer !== null) window.clearInterval(pingTimer);
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, REALTIME_PING_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        let message: AccountRealtimeMessage;
        try {
          message = JSON.parse(String(event.data)) as AccountRealtimeMessage;
        } catch {
          return;
        }
        void invalidateAccountQueries(queryClient, message);
      };

      socket.onclose = async (event) => {
        if (pingTimer !== null) {
          window.clearInterval(pingTimer);
          pingTimer = null;
        }
        if (!shouldReconnectRealtimeSocket(event.code)) {
          stopped = true;
          return;
        }
        if (event.code === 1006) {
          try {
            await getMe();
          } catch (error) {
            if (
              typeof error === "object" &&
              error !== null &&
              "status" in error &&
              error.status === 401
            ) {
              stopped = true;
              return;
            }
          }
        }
        scheduleReconnect();
      };

      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      stopped = true;
      clearTimers();
      socket?.close();
    };
  }, [enabled, queryClient]);
}
