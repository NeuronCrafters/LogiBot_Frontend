import { beforeEach, describe, expect, it, vi } from "vitest";
import baseline from "../../../tests/fixtures/portuguese-ui.json";

beforeEach(() => { localStorage.clear(); vi.resetModules(); vi.spyOn(navigator, "languages", "get").mockReturnValue(["pt-BR"]); });

describe("negociação e preferência", () => {
  it.each([["en-GB", "en-US"], ["ES_mx", "es-ES"], ["pt", "pt-BR"], ["de-DE", undefined], ["en<script>", undefined]])("normaliza %s", async (input, expected) => {
    const { normalizeLanguage } = await import("..");
    expect(normalizeLanguage(input)).toBe(expected);
  });
  it("seleciona o primeiro idioma suportado do navegador e atualiza o HTML", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["de-DE", "es-MX", "en-US"]);
    const language = await import("..");
    expect(language.getLanguage()).toBe("es-ES");
    expect(document.documentElement.lang).toBe("es-ES");
    expect(language.requestLanguageHeaders()).toEqual({ "Accept-Language": "es-ES" });
  });
  it("restaura a escolha local sem forçá-la sobre a conta no login", async () => {
    localStorage.setItem("logibot.language", JSON.stringify({mode:"fixed",language:"es-ES"}));
    const language = await import("..");
    expect(language.getLanguage()).toBe("es-ES");
    language.applyAccountLanguage("en-US");
    expect(language.getLanguage()).toBe("en-US");
    expect(language.requestLanguageHeaders()).not.toHaveProperty("X-Language");
    language.clearAccountLanguage();
    expect(language.getLanguage()).toBe("es-ES");
  });
  it("preserva escolha explícita recente, persiste e permite seguir o navegador", async () => {
    const language = await import("..");
    language.chooseLanguage("es-ES");
    language.applyAccountLanguage("en-US");
    expect(language.getLanguage()).toBe("es-ES");
    expect(language.requestLanguageHeaders()).toEqual({"Accept-Language":"es-ES","X-Language":"es-ES"});
    language.chooseLanguage(null);
    expect(language.getLanguage()).toBe("pt-BR");
    expect(JSON.parse(localStorage.getItem(language.LANGUAGE_STORAGE_KEY)!)).toEqual({mode:"system"});
  });
  it("não transfere uma escolha explícita de uma conta para a conta seguinte", async () => {
    const language = await import("..");
    language.chooseLanguage("en-US");
    language.applyAccountLanguage("en-US");
    language.clearAccountLanguage(true);
    expect(language.getExplicitSelection()).toBeUndefined();
    expect(language.getLanguage()).toBe("en-US");
    language.applyAccountLanguage("es-ES");
    expect(language.getLanguage()).toBe("es-ES");
  });
  it("ignora preferências locais inválidas sem impedir a inicialização", async () => {
    localStorage.setItem("logibot.language", "invalid json");
    expect((await import("..")).getLanguage()).toBe("pt-BR");
  });
});

describe("catálogos e formatação", () => {
  it("preserva todos os textos portugueses inventariados", async () => {
    const { catalogs } = await import("..");
    for (const [key,value] of Object.entries(baseline)) expect(catalogs["pt-BR"][key as keyof typeof catalogs["pt-BR"]]).toBe(value);
  });
  it("mantém chaves e parâmetros equivalentes nos três idiomas", async () => {
    const { catalogs } = await import("..");
    for (const language of ["en-US","es-ES"] as const) {
      expect(Object.keys(catalogs[language]).sort()).toEqual(Object.keys(catalogs["pt-BR"]).sort());
      for (const key of Object.keys(catalogs["pt-BR"]) as (keyof typeof catalogs["pt-BR"])[]) {
        const params=(value:string)=>(value.match(/\{\{\w+\}\}/g)||[]).sort();
        expect(params(catalogs[language][key])).toEqual(params(catalogs["pt-BR"][key]));
      }
    }
  });
  it("interpola valores sem traduzir nomes e usa plurais", async () => {
    const language=await import("..");
    language.chooseLanguage("en-US");
    expect(language.t("common.questions",{count:1})).toBe("1 question");
    expect(language.t("common.questions",{count:2})).toBe("2 questions");
    language.chooseLanguage("es-ES");
    expect(language.t("common.questions",{count:1})).toBe("1 pregunta");
    expect(language.t("admin.voceEstaPrestesAEditarValue0Deseja",{value0:"João da Silva"})).toContain("João da Silva");
  });
  it("formata números, percentuais e datas sem modificar seus valores", async () => {
    const language=await import("..");
    language.chooseLanguage("pt-BR"); expect(language.number(1234.5)).toBe("1.234,5");
    language.chooseLanguage("en-US"); expect(language.number(1234.5)).toBe("1,234.5");
    expect(language.percent(0.75)).toBe("75%");
    expect(language.date("2026-10-28",{year:"numeric",month:"2-digit",day:"2-digit"})).toBe("10/28/2026");
    language.chooseLanguage("es-ES"); expect(language.date("2026-10-28",{year:"numeric",month:"2-digit",day:"2-digit"})).toBe("28/10/2026");
  });
  it("mantém datas técnicas e traduz tempo relativo e duração", async () => {
    const language=await import("..");
    const format=await import("@/shared/lib/formatDate");
    const start=new Date(2026,9,28,12),end=new Date(2026,9,28,14);
    expect(format.formatISODate(start)).toBe("2026-10-28");
    language.chooseLanguage("en-US");expect(format.formatDuration(end,start)).toBe("2 hours");
    language.chooseLanguage("es-ES");expect(format.formatDuration(end,start)).toBe("2 horas");
    vi.spyOn(Date,"now").mockReturnValue(end.getTime());
    expect(format.formatRelativeTime(start)).toBe("hace 2 horas");
  });
});
