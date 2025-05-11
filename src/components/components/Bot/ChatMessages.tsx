import { Avatar } from "@/components/components/Avatar/Avatar";
import logo from "@/assets/logo.svg";
import { Typograph } from "@/components/components/Typograph/Typograph";

interface Message {
  role: "user" | "assistant";
  content: string;
  context?: "quiz" | "chat";
}

interface ChatMessagesProps {
  messages: Message[];
  userName: string;
  userId: string;
}

function ChatMessages({ messages, userName, userId }: ChatMessagesProps) {
  const formatMessage = (message: Message) => {
    const { content } = message;

    const isInstruction =
      content.toLowerCase().includes("escolha seu n\u00edvel") ||
      content.toLowerCase().includes("escolha um assunto") ||
      content.toLowerCase().includes("escolha um t\u00f3pico") ||
      content.toLowerCase().includes("t\u00f3pico selecionado") ||
      content.toLowerCase().includes("suas perguntas est\u00e3o prontas") ||
      content.toLowerCase().includes("respostas:") ||
      content.toLowerCase().includes("⚠️") ||
      content.toLowerCase().includes("praticar") ||
      content.toLowerCase().includes("gerando suas perguntas");

    if (isInstruction) {
      return (
        <Typograph
          text={content}
          variant="text8"
          weight="regular"
          fontFamily="poppins"
          colorText="text-white"
        />
      );
    }

    if (content.includes("\n")) {
      return content.split("\n").map((line, idx) => (
        <p
          key={idx}
          className="mb-1 leading-snug text-left whitespace-pre-wrap"
        >
          {line}
        </p>
      ));
    }

    return <p className="text-left whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const content = formatMessage(message);
        if (!content) return null;

        return (
          <div
            key={index}
            className={`flex items-end w-full mb-3 ${isUser ? "justify-end" : "justify-start"
              } animate-fade-in`}
          >
            {!isUser && (
              <div className="mr-2">
                <img
                  src={logo}
                  alt="Bot"
                  className="w-10 h-10 rounded-full bg-white p-1"
                />
              </div>
            )}

            <div
              className={`p-3 rounded-xl max-w-[75%] ${isUser
                  ? "bg-blue-600 text-white ml-auto rounded-br-none"
                  : "bg-gray-800 text-gray-100 mr-auto rounded-bl-none"
                }`}
            >
              {content}
            </div>

            {isUser && (
              <div className="ml-2 rainbow-avatar w-10 h-10 rounded-full flex items-center justify-center">
                <Avatar
                  seed={userId}
                  backgroundColor="#2a2a2a"
                  className="w-full h-full rounded-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { ChatMessages };
