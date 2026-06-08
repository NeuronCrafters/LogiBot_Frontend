import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { baseURL } from "@/shared/api/httpClient";

export type AdminLogSource = "backend" | "worker";
export type AdminLogLevel = "INFO" | "WARN" | "ERROR";

export type AdminLogEntry = {
  id: number;
  timestamp: string;
  source: AdminLogSource;
  level: AdminLogLevel;
  scope: string;
  message: string;
  details?: unknown;
};

const MAX_ENTRIES = 1000;
const ADMIN_LOGS_NAMESPACE = "/admin/logs";

export type AdminLogsConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export function useAdminLogsSocket(enabled: boolean) {
  const [entries, setEntries] = useState<AdminLogEntry[]>([]);
  const [status, setStatus] = useState<AdminLogsConnectionStatus>("connecting");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    setStatus("connecting");
    const socket = io(`${baseURL}${ADMIN_LOGS_NAMESPACE}`, {
      withCredentials: true,
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("error"));

    socket.on("history", (history: AdminLogEntry[]) => {
      setEntries(history.slice(-MAX_ENTRIES));
    });

    socket.on("log", (entry: AdminLogEntry) => {
      setEntries((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_ENTRIES ? next.slice(-MAX_ENTRIES) : next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  function clear() {
    setEntries([]);
  }

  return { entries, status, clear };
}
