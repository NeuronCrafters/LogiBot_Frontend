import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Typograph } from "@/components/components/Typograph/Typograph";
import { ButtonInfo } from "@/components/components/Button/ButtonInfo";

export function Infos() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);

  useEffect(() => {
    const hasReadInfo = localStorage.getItem("infosRead");
    const isGoodbyePage = window.location.pathname === "/goodbye";

    if (!hasReadInfo && !isGoodbyePage) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("infosRead", "true");
    setIsOpen(false);
  };

  const handleDecline = () => {
    setIsOpen(false);
    setIsDeclineModalOpen(true);
  };

  const handleRetry = () => {
    setIsDeclineModalOpen(false);
    setIsOpen(true);
  };

  const handleFinalDecline = () => {
    setIsDeclineModalOpen(false);
    setTimeout(() => {
      window.location.href = "/goodbye";
    }, 300);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl bg-[#141414] p-6 rounded-lg shadow-lg overflow-auto max-h-[90vh]"
        >
          <DialogHeader>
            <Typograph
              text="Aviso Importante"
              colorText="text-white"
              variant="title1"
              weight="bold"
              fontFamily="poppins"
            />
          </DialogHeader>
          <div className="space-y-4">
            <Typograph
              text="Bem-vindo(a) à plataforma! Gostaríamos de informar que coletamos dados de uso da plataforma Chat SAEL, para aprimorar a experiência do usuário."
              colorText="text-white"
              variant="text3"
              weight="regular"
              fontFamily="poppins"
            />
            <Typograph
              text="Esses dados são tratados com total segurança e em conformidade com a legislação vigente. Ao continuar, você concorda com a coleta e o uso dessas informações."
              colorText="text-white"
              variant="text3"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
          <div className="flex justify-between space-x-4 mt-4">
            <ButtonInfo type="agree" onClick={handleAccept} />
            <ButtonInfo type="disagree" onClick={handleDecline} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent
          className="max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl bg-[#141414] p-6 rounded-lg shadow-lg overflow-auto max-h-[90vh]"
        >
          <DialogHeader>
            <Typograph
              text="Lamentamos a sua decisão"
              colorText="text-white"
              variant="title1"
              weight="bold"
              fontFamily="poppins"
            />
          </DialogHeader>
          <div className="space-y-4">
            <Typograph
              text="Infelizmente, não será possível continuar usando a plataforma sem concordar com os termos. Caso mude de ideia, você poderá aceitar as condições e aproveitar todos os recursos oferecidos."
              colorText="text-white"
              variant="text3"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
          <div className="flex justify-between space-x-4 mt-4">
            <ButtonInfo type="agree" onClick={handleRetry} label="Voltar e Concordar" />
            <ButtonInfo type="disagree" onClick={handleFinalDecline} label="Sair" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
