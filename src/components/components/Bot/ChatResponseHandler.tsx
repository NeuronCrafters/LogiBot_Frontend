import { useEffect, useState } from "react";
import { rasaService } from "@/services/api/api_rasa";
import { Button } from "@/components/ui/button";

interface ChatResponseHandlerProps {
  onSend: (message: string) => void;
}

function ChatResponseHandler({ onSend }: ChatResponseHandlerProps) {
  const [buttons, setButtons] = useState<{ title: string; payload: string }[]>([]);

  useEffect(() => {
    async function fetchInitialOptions() {
      try {
        const data = await rasaService.listarNiveis();
        const firstResponse = data.responses?.[0];
        console.log("Resposta Rasa:", firstResponse);

        if (firstResponse?.buttons?.length > 0) {
          setButtons(firstResponse.buttons);
        }
      } catch (error) {
        console.error("Erro ao listar níveis:", error);
      }
    }

    fetchInitialOptions();
  }, []);


  const handleButtonClick = (payload: string) => {
    onSend(payload);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4 max-w-2xl mx-auto">
      {buttons.map((btn, index) => (
        <Button
          key={index}
          onClick={() => handleButtonClick(btn.payload)}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 py-2"
        >
          {btn.title}
        </Button>
      ))}
    </div>
  );
}

export { ChatResponseHandler }
