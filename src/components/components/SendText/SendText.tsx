import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon } from "lucide-react";

export function SendText() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() !== "") {
      console.log("Mensagem enviada:", message);
      setMessage("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-[#181818] p-4 shadow-md">
      <div className="w-[800px] h-[120px] flex items-center gap-0 rounded-lg">
        <Textarea
          rows={1}
          value={message}
          onChange={handleChange}
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-transparent text-white border-none resize-none outline-none p-2 rounded-l-lg"
        />

        <Button
          variant="default"
          onClick={handleSend}
          disabled={!message.trim()}
          className={`rounded-r-lg p-3 ${message.trim() ? "bg-black-600 hover:bg-black-700" : "bg-black-500"
            }`}
        >
          <SendIcon className="text-white" style={{ width: "28px", height: "28px" }} />
        </Button>
      </div>
    </div>
  );
}
