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
    <div className="flex flex-wrap justify-center max-w-2xl gap-3 mx-auto mt-4">
      {buttons.map((btn, index) => (
        <Button
          key={index}
          onClick={() => handleButtonClick(btn.payload)}
          className="px-4 py-2 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
        >
          {btn.title}
        </Button>
      ))}
    </div>
  );
}

export { ChatResponseHandler }
