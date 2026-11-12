import { t } from "@/i18n";

/** Readable names of the quiz subjects returned by the API. Unknown subjects keep their original name. */
export function subjectLabel(subject: string) {
  const names: Record<string, string> = {
    variaveis: t("common.variaveis"),
    listas: t("common.listas"),
    verificacoes: t("common.condicionais"),
    condicionais: t("common.condicionais"),
    funcoes: t("common.funcoes"),
    operadores_logicos: t("dashboard.opLogicos"),
    loops: t("dashboard.repeticao"),
    repeticao: t("dashboard.repeticao"),
  };
  return names[subject] || subject;
}
