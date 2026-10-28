import { t, type MessageKey } from "@/i18n";

export type ToastMessage = string | { key: MessageKey; params?: Record<string, unknown> };
export function resolveToastMessage(message: ToastMessage) { return typeof message === "string" ? message : t(message.key, message.params); }

export type ToastType = "success" | "error" | "warn" | "info";

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: ToastMessage;
}

type Listener = (event: ToastEvent) => void;

const listeners = new Set<Listener>();

function emit(type: ToastType, message: ToastMessage) {
  const event: ToastEvent = { id: crypto.randomUUID(), type, message };
  listeners.forEach((l) => l(event));
}

function toastFn(message: ToastMessage) {
  emit("info", message);
}
toastFn.success = (message: ToastMessage) => emit("success", message);
toastFn.error = (message: ToastMessage) => emit("error", message);
toastFn.warn = (message: ToastMessage) => emit("warn", message);
toastFn.info = (message: ToastMessage) => emit("info", message);

export const toast = toastFn;

export function subscribeToToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
