import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/assets/logo.svg";

interface Message {
  role: string;
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
  userName: string;
}

function ChatMessages({ messages, userName }: ChatMessagesProps) {
  return (
    <div className="flex flex-col items-center w-full h-screen py-32">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-end w-full max-w-lg mb-3 ${message.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
        >
          {message.role === "assistant" && (
            <div className="mr-2">
              <img
                src={logo}
                alt="Bot"
                className="w-10 h-10 rounded-full bg-white p-1"
              />
            </div>
          )}

          <div
            className={`p-3 rounded-lg max-w-[75%] ${message.role === "user"
              ? "bg-blue-600 text-white ml-auto rounded-br-none"
              : "bg-gray-800 text-gray-200 mr-auto rounded-bl-none"
              }`}
          >
            {message.content}
          </div>

          {message.role === "user" && (
            <Avatar className="ml-2 bg-gray-700 w-10 h-10">
              <AvatarFallback className="text-white font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
    </div>
  );
}

export { ChatMessages }