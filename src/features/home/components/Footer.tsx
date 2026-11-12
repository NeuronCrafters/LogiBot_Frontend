import { t, useLocale } from "@/i18n";
﻿import { Typograph } from "@/shared/components/Typography";

export function Footer() {
  useLocale();

  return (
    <footer className="w-full bg-surface text-center p-4">
      <Typograph
        text={t("home.value0SistemaDeApoioAoEnsinoDe", { value0: new Date().getFullYear() })}
        colorText="text-gray-400"
        variant="text8"
        weight="regular"
        fontFamily="poppins"
      />
    </footer>
  );
}
