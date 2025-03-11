import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate(-1)} variant="outline" className="flex items-center mb-6 w-[112px] text-[#FFF]">
      <ArrowLeft className="w-5 h-5 mr-2" />
      Voltar
    </Button>
  );
}
