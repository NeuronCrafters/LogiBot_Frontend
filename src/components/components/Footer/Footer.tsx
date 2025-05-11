import { Typograph } from "@/components/components/Typograph/Typograph";

export function Footer() {
  return (
    <footer className="w-full bg-[#1F1F1F] text-center p-4">
      <Typograph
        text={`© ${new Date().getFullYear()} Sistema de Apoio ao Ensino de Lógica. Todos os direitos reservados.`}
        colorText="text-gray-400"
        variant="text8"
        weight="regular"
        fontFamily="poppins"
      />
    </footer>
  );
}
