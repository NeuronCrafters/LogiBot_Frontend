import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  AdminWelcome,
  NonStudentWelcome,
} from "@/features/chat/components/ChatWelcomePages";
import StudentChatContent from "@/features/chat/components/StudentChatContent";

export function Chat() {
  const { user, isAuthenticated } = useAuth();

  const userRoles = Array.isArray(user?.role)
    ? user?.role
    : user?.role
      ? [user.role]
      : [];
  const isStudent = userRoles.includes("student");
  const isAdmin = userRoles.includes("admin");

  return (
    <>
      {isAuthenticated && isStudent && user && (
        <StudentChatContent user={user} />
      )}

      {isAuthenticated && isAdmin && !isStudent && <AdminWelcome />}

      {isAuthenticated && !isStudent && !isAdmin && (
        <NonStudentWelcome userRoles={userRoles} />
      )}
    </>
  );
}
