import { useEffect } from "react";

interface StartConversationProps {
  onStart: () => void;
}

export const StartConversation = ({ onStart }: StartConversationProps) => {
  useEffect(() => {
    onStart();
  }, [onStart]);

  return null;
};