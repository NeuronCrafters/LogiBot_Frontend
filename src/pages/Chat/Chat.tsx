import { useAuth } from "@/hooks/use-Auth";
import { AdminWelcome, NonStudentWelcome } from "@/components/Chat/ChatWelcomePages";
import StudentChatContent from "@/components/Chat/StudentChatContent";
import { useMultiPageTour, UserRole } from "@/hooks/useMultiPageTour";

export function Chat() {
    const { user, isAuthenticated } = useAuth();

    const userRoles = Array.isArray(user?.role) ? user?.role : user?.role ? [user.role] : [];
    const isStudent = userRoles.includes('student');
    const isAdmin = userRoles.includes('admin');

    const mainRole = (userRoles[0] || 'guest') as UserRole;

    useMultiPageTour(mainRole);

    return (
        <>
            {isAuthenticated && isStudent && user && (
                <StudentChatContent user={user} />
            )}

            {isAuthenticated && isAdmin && !isStudent && (
                <AdminWelcome />
            )}

            {isAuthenticated && !isStudent && !isAdmin && (
                <NonStudentWelcome userRoles={userRoles} />
            )}
        </>
    );
}
