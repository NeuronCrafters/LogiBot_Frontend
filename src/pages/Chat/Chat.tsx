import { useAuth } from "@/hooks/use-Auth";
import ChatLayout from "@/components/components/Chat/ChatLayout";
import { AdminWelcome, NonStudentWelcome } from "@/components/components/Chat/ChatWelcomePages";
import StudentChatContent from "@/components/components/Chat/StudentChatContent";
import { useState } from "react";
import { useMultiPageTour, UserRole } from "@/hooks/useMultiPageTour";

export function Chat() {
    const { user, isAuthenticated } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    const userRoles = Array.isArray(user?.role) ? user?.role : user?.role ? [user.role] : [];
    const isStudent = userRoles.includes('student');
    const isAdmin = userRoles.includes('admin');

    const mainRole = (userRoles[0] || 'guest') as UserRole;

    useMultiPageTour(mainRole, {
        openMenu: () => setMenuOpen(true),
        closeMenu: () => setMenuOpen(false),
    });

    return (
        <ChatLayout user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen}>
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