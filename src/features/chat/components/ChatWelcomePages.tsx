import { t, useLocale } from "@/i18n";
import { MessageSquare, Lock, Info } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Typograph } from "@/shared/components/Typography";

export const NonStudentWelcome: React.FC<{ userRoles: string[] }> = ({
  userRoles,
}) => {
  useLocale();

  return (
    <div className="flex-1 w-full max-w-2xl px-4 pt-32 pb-40 mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-lg bg-gradient-to-r from-violet-500 to-purple-600">
          <MessageSquare size={32} className="text-white" />
        </div>
        <Typograph
          text={t("chat.bemVindoAoChatLogibot")}
          colorText="text-white"
          variant="text1"
          weight="bold"
          fontFamily="poppins"
          className="mb-4"
        />
        <Typograph
          text={t("chat.nossoChatEducacionalEUmaFerramentaExclusiva")}
          colorText="text-gray-400"
          variant="text6"
          weight="regular"
          fontFamily="poppins"
        />
      </div>

      <div className="bg-surface rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <Lock className="mt-1 text-purple-500" size={24} />
          <div>
            <Typograph
              text={t("chat.acessoRestrito")}
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
              className="mb-2"
            />
            <Typograph
              text={t("chat.estaAreaEExclusivaParaEstudantesA")}
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
        </div>

        <Alert className="bg-surface-raised border-purple-600 mt-4">
          <Info className="w-5 h-5 text-purple-500" />
          <AlertTitle className="text-white">
            <Typograph
              text={t("chat.voceNaoTemAcessoAEstaArea")}
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
            />
          </AlertTitle>
          <AlertDescription className="text-gray-400">
            <Typograph
              text={t("chat.seuPerfilAtualValue0NaoTemPermissao", { value0: userRoles.join(", ") })}
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </AlertDescription>
        </Alert>
      </div>
      <div className="text-center" />
    </div>
  );
};

export const AdminWelcome: React.FC = () => {
  useLocale();

  return (
    <div className="flex-1 w-full max-w-2xl px-4 pt-32 pb-40 mx-auto">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-full shadow-lg bg-gradient-to-r from-fuchsia-500 to-orange-600">
          <Lock size={32} className="text-white" />
        </div>
        <Typograph
          text={t("chat.chatExclusivo")}
          colorText="text-white"
          variant="text1"
          weight="bold"
          fontFamily="poppins"
          className="mb-4"
        />
        <Typograph
          text={t("chat.comoAdministradorVoceTemAcessoADiferentes")}
          colorText="text-gray-400"
          variant="text6"
          weight="regular"
          fontFamily="poppins"
        />
      </div>

      <div className="bg-surface rounded-lg p-6 mb-8 border border-neutral-800 shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <Info className="mt-1 text-fuchsia-400" size={24} />
          <div>
            <Typograph
              text={t("chat.chatExclusivoParaEstudantes")}
              colorText="text-white"
              variant="text6"
              weight="bold"
              fontFamily="poppins"
              className="mb-2"
            />
            <Typograph
              text={t("chat.aFuncionalidadeDeChatFoiProjetadaExclusivamente")}
              colorText="text-gray-400"
              variant="text7"
              weight="regular"
              fontFamily="poppins"
            />
          </div>
        </div>

        <div className="p-[2px] rounded-lg bg-gradient-to-r from-fuchsia-500 to-orange-600">
          <Alert className="bg-surface-raised rounded-lg">
            <Info className="w-5 h-5 text-fuchsia-400" />
            <AlertTitle className="text-white">
              <Typograph
                text={t("chat.permissaoDeAdministrador")}
                colorText="text-white"
                variant="text6"
                weight="bold"
                fontFamily="poppins"
              />
            </AlertTitle>
            <AlertDescription className="text-gray-400">
              <Typograph
                text={t("chat.comoAdministradorVoceTemAcessoAsFuncionalidades")}
                colorText="text-gray-400"
                variant="text7"
                weight="regular"
                fontFamily="poppins"
              />
            </AlertDescription>
          </Alert>
        </div>
      </div>
      <div className="text-center" />
    </div>
  );
};
