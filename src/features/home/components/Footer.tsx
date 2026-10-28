import { Typograph } from "@/shared/components/Typography";

export function Footer() {
  return (
    <footer className="w-full bg-[#1F1F1F] text-center p-4">
      <Typograph
        text={`© ${new Date().getFullYear()} Logic Teaching Support System. All rights reserved.`}
        colorText="text-gray-400"
        variant="text8"
        weight="regular"
        fontFamily="poppins"
      />
    </footer>
  );
}
