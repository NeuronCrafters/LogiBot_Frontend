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
  const formatMessage = (content: string) => {
    if (content.includes("Nível")) {
      return (
        <div className="flex flex-col items-center">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg mb-2">
            {content}
          </div>
          <div className="text-gray-400 text-sm">
            Agora você pode começar a interagir com o SAEL!
          </div>
        </div>
      );
    }

    if (content.includes("\n")) {
      return content.split("\n").map((line, idx) => (
        <p key={idx} className="mb-1 leading-snug text-left whitespace-pre-wrap">
          {line}
        </p>
      ));
    }

    return <p className="text-left whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex items-end w-full mb-3 ${message.role === "user" ? "justify-end" : "justify-start"
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
            {formatMessage(message.content)}
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

export { ChatMessages };
