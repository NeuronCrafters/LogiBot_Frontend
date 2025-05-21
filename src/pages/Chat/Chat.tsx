import { useAuth } from "@/hooks/use-Auth";
import ChatLayout from "@/components/components/Chat/ChatLayout";
import StudentChatContent from "@/components/components/Chat/StudentChatContent";
import { AdminWelcome, NonStudentWelcome } from "@/components/components/Chat/ChatWelcomePages";

export function Chat() {
  const { user, isAuthenticated } = useAuth();

  const userRoles = Array.isArray(user?.role) ? user?.role : user?.role ? [user.role] : [];
  const isStudent = userRoles.includes('student');
  const isAdmin = userRoles.includes('admin');

  return (
    <ChatLayout user={user}>
      {isAuthenticated && isStudent && user && (
        <StudentChatContent user={user} />
      )}

      {isAuthenticated && isAdmin && !isStudent && (
        <AdminWelcome />
      )}

      {isAuthenticated && !isStudent && !isAdmin && (
        <NonStudentWelcome userRoles={userRoles} />
      )}
    </ChatLayout>
  );
}