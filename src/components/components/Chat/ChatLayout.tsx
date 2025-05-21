import { Avatar } from '@/components/components/Avatar/Avatar';
import { User } from '@/contexts/AuthContext';
import { Typograph } from '../Typograph/Typograph';
import { ReactNode, useState } from 'react';
import { Header } from '../Header/Header';

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
    <div className="flex min-h-screen bg-[#141414] flex-col items-center w-full">
      <div className="absolute bg-[#141414] w-full flex items-center gap-4 border-b border-neutral-800 px-8 py-4 z-10">
        <Typograph text="Chat SAEL" colorText="text-white" variant="text2" weight="bold" fontFamily="poppins" />
        {user && (
          <div className="ml-auto">
            <button onClick={() => setMenuOpen(true)} className="p-0 flex items-center justify-center">
              <div className="rainbow-avatar w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center">
                <Avatar seed={user._id} backgroundColor="#141414" className="w-full h-full rounded-full" />
              </div>
            </button>
          </div>
        )}
      </div>

      <Header isOpen={menuOpen} closeMenu={() => setMenuOpen(false)} />

      {children}
    </div>
  );
};

export default ChatLayout;