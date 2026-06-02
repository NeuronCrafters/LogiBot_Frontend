export type ToastType = "success" | "error" | "warn" | "info";

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (event: ToastEvent) => void;

const listeners = new Set<Listener>();

function emit(type: ToastType, message: string) {
  const event: ToastEvent = { id: crypto.randomUUID(), type, message };
  listeners.forEach(l => l(event));
}

function toastFn(message: string) {
  emit("info", message);
}
toastFn.success = (message: string) => emit("success", message);
toastFn.error   = (message: string) => emit("error",   message);
toastFn.warn    = (message: string) => emit("warn",    message);
toastFn.info    = (message: string) => emit("info",    message);

export const toast = toastFn;

export function subscribeToToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
