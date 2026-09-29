import type { User } from "@/app/providers/AuthContext";
import { usersById } from "./fixtures/users";

const CURRENT_USER_KEY = "mock_current_user_id";

export function setCurrentUserId(id: string): void {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

export function clearCurrentUserId(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  return id ? (usersById[id] ?? null) : null;
}
