import { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { resetPreferences, setPreference } from "@/shared/preferences";
import { rootFontSize, scaleFont, useChartPreferences } from "../chartPreferences";

// Recharts needs real layout; these stand-ins expose the props each chart receives.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  const probe = (name: string) => (props: any) => (
    <div
      data-testid={name}
      data-animate={props.isAnimationActive === undefined ? undefined : String(props.isAnimationActive)}
      data-font={props.tick?.fontSize ?? props.label?.fontSize ?? props.fontSize}
    >
      {props.children}
    </div>
  );
  const container = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ...actual,
    ResponsiveContainer: container,
    PieChart: ({ children }: { children?: ReactNode }) => <svg>{children}</svg>,
    LineChart: container,
    RadarChart: container,
    Pie: probe("pie"),
    Line: probe("line"),
    Radar: probe("radar"),
    XAxis: probe("x-axis"),
    YAxis: probe("y-axis"),
    PolarAngleAxis: probe("polar-angle-axis"),
    ReferenceLine: probe("reference-line"),
    LabelList: probe("label-list"),
    Cell: () => null,
    Tooltip: () => null,
    Legend: () => null,
    CartesianGrid: () => null,
    PolarGrid: () => null,
    PolarRadiusAxis: () => null,
  };
});

vi.mock("@/services/apiClient", () => ({
  logApi: { getFilteredStudentSummary: vi.fn(async () => ({ totalCorrectAnswers: 8, totalWrongAnswers: 2 })) },
}));

vi.mock("@/features/dashboard/api/dashboardApi", () => ({
  dashboardApi: {
    getLearningJourney: vi.fn(async () => ({ data: { labels: ["Quiz 1", "Quiz 2"], data: [0, 75] } })),
    getProficiencyRadar: vi.fn(async () => ({ data: { labels: ["variaveis", "funcoes"], data: [0, null] } })),
  },
}));

vi.mock("../components/DashboardInsightProvider", () => ({ useDashboardInsights: () => ({ openChart: vi.fn() }) }));

const { CorrectWrongChart } = await import("../components/charts/CorrectWrongChart");
const { LearningJourneyChart } = await import("../components/charts/LearningJourneyChart");
const { ProficiencyRadarChart } = await import("../components/charts/ProficiencyRadarChart");

const filter = { type: "university" as const, ids: ["u1"], mode: "individual" as const, hierarchyParams: { universityId: "u1" } };

function renderWithQuery(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

beforeEach(() => {
  resetPreferences();
  act(() => chooseLanguage("pt-BR"));
});

afterEach(() => {
  document.documentElement.style.fontSize = "";
  resetPreferences();
});

describe("tamanho do texto dos gráficos", () => {
  it("usa o tamanho calculado da raiz e, sem ele, a preferência escolhida", () => {
    const root = document.createElement("html");
    root.style.fontSize = "32px";
    document.body.append(root);
    expect(rootFontSize("default", root)).toBe(32);
    root.remove();
    expect(rootFontSize("larger", null)).toBe(20);
    expect(rootFontSize("large", null)).toBe(18);
    expect(scaleFont(11, 1.25)).toBe(13.75);
  });

  it("acompanha a mudança de preferência sem recarregar", () => {
    const { result } = renderHook(() => useChartPreferences());
    const initial = result.current.font(11);
    act(() => {
      document.documentElement.style.fontSize = "20px";
      setPreference("textSize", "larger");
    });
    expect(result.current.font(11)).toBe(13.75);
    expect(result.current.font(11)).toBeGreaterThan(initial);
  });

  it("os rótulos de um gráfico já aberto aumentam ao escolher texto muito maior", async () => {
    renderWithQuery(<LearningJourneyChart filters={{ universityId: "u1" }} />);
    const axis = await screen.findByTestId("x-axis");
    expect(Number(axis.dataset.font)).toBe(11);
    act(() => {
      document.documentElement.style.fontSize = "20px";
      setPreference("textSize", "larger");
    });
    expect(Number(screen.getByTestId("x-axis").dataset.font)).toBe(13.75);
    expect(Number(screen.getByTestId("y-axis").dataset.font)).toBe(13.75);
    expect(Number(screen.getByTestId("label-list").dataset.font)).toBe(13.75);
  });
});

describe("movimento dos gráficos", () => {
  it("o gráfico de pizza já aberto para de animar quando o movimento é reduzido", async () => {
    renderWithQuery(<CorrectWrongChart filter={filter} />);
    const pie = await screen.findByTestId("pie");
    expect(pie.dataset.animate).toBe("true");
    act(() => setPreference("motion", "reduce"));
    expect(screen.getByTestId("pie").dataset.animate).toBe("false");
    act(() => setPreference("motion", "full"));
    expect(screen.getByTestId("pie").dataset.animate).toBe("true");
  });

  it("respeita o movimento reduzido já no primeiro carregamento", async () => {
    act(() => setPreference("motion", "reduce"));
    renderWithQuery(<LearningJourneyChart filters={{ universityId: "u1" }} />);
    expect((await screen.findByTestId("line")).dataset.animate).toBe("false");
  });
});

describe("tabela equivalente", () => {
  it("abre pelo teclado e mostra os mesmos valores do gráfico", async () => {
    renderWithQuery(<CorrectWrongChart filter={filter} />);
    const toggle = await screen.findByRole("button", { name: "Ver dados em tabela" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    toggle.focus();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const table = screen.getByRole("table", { name: /Acertos e erros: dados do filtro selecionado/ });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Resultado", "Respostas (quantidade)", "Percentual"]);
    const rows = within(table).getAllByRole("row").slice(1, 3).map((row) => row.textContent);
    expect(rows[0]).toMatch(/Acertos.*8.*80,0\s?%/);
    expect(rows[1]).toMatch(/Erros.*2.*20,0\s?%/);
    expect(screen.getByRole("region", { name: /Acertos e erros/ })).toHaveAttribute("tabindex", "0");
  });

  it("diferencia zero de ausência de respostas", async () => {
    renderWithQuery(<ProficiencyRadarChart filters={{ universityId: "u1" }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver dados em tabela" }));
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.textContent);
    expect(rows[0]).toMatch(/Variáveis.*0,0\s?%/);
    expect(rows[1]).toMatch(/Funções.*Sem respostas de quiz/);
  });

  it("a jornada informa a variação e o primeiro quiz", async () => {
    renderWithQuery(<LearningJourneyChart filters={{ universityId: "u1" }} />);
    fireEvent.click(await screen.findByRole("button", { name: "Ver dados em tabela" }));
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1, 3).map((row) => row.textContent);
    expect(rows[0]).toMatch(/Quiz 1.*0,0\s?%.*Primeiro quiz/);
    expect(rows[1]).toMatch(/Quiz 2.*75,0\s?%.*\+75,0/);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());
  });
});
