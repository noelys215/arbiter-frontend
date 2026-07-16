export const REALTIME_RECONNECT_DELAY_MS = 1500;
export const REALTIME_PING_INTERVAL_MS = 25000;

export function shouldReconnectRealtimeSocket(closeCode: number) {
  return closeCode !== 1008;
}
