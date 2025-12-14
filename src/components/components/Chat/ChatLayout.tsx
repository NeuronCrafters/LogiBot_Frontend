import { User } from '@/contexts/AuthContext';
import { Typograph } from '../Typograph/Typograph';
import { ReactNode, useState } from 'react';
import { Header } from '../Header/Header';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface ChatLayoutProps {
    user: User | null;
    children: ReactNode;
    menuOpen?: boolean;
    setMenuOpen?: (isOpen: boolean) => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
    user,
    children,
    menuOpen: externalMenuOpen,
    setMenuOpen: externalSetMenuOpen
}) => {
    const [internalMenuOpen, setInternalMenuOpen] = useState(false);

    const menuOpen = externalMenuOpen !== undefined ? externalMenuOpen : internalMenuOpen;
    const setMenuOpen = externalSetMenuOpen || setInternalMenuOpen;

    return (
        <div className="relative flex min-h-screen bg-[#141414] flex-col items-center w-full">
            <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
                <Typograph text="Chat LogiBot" colorText="text-white" variant="text2" weight="bold" fontFamily="poppins" />
                {user && (
                    <div className="ml-auto">
                        <Button
                            id="chat-header-menu-button"
                            onClick={() => setMenuOpen(true)}
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            <Menu size={32} strokeWidth={3} />
                        </Button>
                    </div>
                )}
            </div>

            <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

            {children}
        </div>
    );
};

export default ChatLayout;