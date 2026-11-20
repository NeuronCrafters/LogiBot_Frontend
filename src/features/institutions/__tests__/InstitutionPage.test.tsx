import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { chooseLanguage } from "@/i18n";
import { institutionsApi, type InstitutionPageData } from "@/features/institutions/api/institutionsApi";
import { InstitutionPage } from "@/features/institutions/pages/InstitutionPage";
import { featuresApi } from "@/features/release/api/featuresApi";
import { renderCrop } from "@/features/institutions/lib/imageCrop";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
vi.mock("@/features/institutions/api/institutionsApi", async (original) => ({
  ...(await original<typeof import("@/features/institutions/api/institutionsApi")>()),
  institutionsApi: { list: vi.fn(), page: vi.fn(), update: vi.fn(), setImage: vi.fn(), setStatus: vi.fn(), geocode: vi.fn(), postalCode: vi.fn() },
}));
vi.mock("@/features/release/api/featuresApi", () => ({ featuresApi: { setRule: vi.fn() } }));
// jsdom draws no images: the framing maths is covered in imageCrop.test.ts and the real drawing in the browser tests.
vi.mock("@/features/institutions/lib/imageCrop", async (original) => ({
  ...(await original<typeof import("@/features/institutions/lib/imageCrop")>()),
  loadImage: vi.fn(async () => ({ naturalWidth: 800, naturalHeight: 400 })),
  renderCrop: vi.fn(async () => "data:image/webp;base64,UklGRg=="),
}));
const api = vi.mocked(institutionsApi);

const header = {
  components: { location: true, photo: true },
  institution: { id: "i1", name: "Faculdade Teste", kind: "faculdade" as const, city: "Belém", state: "PA", country: null,
    address: "Av. Exemplo", addressNumber: "100", district: "Guamá", postalCode: "66000-000", latitude: -1.4558, longitude: -48.4902, website: "https://teste.edu.br",
    links: [{ kind: "instagram" as const, url: "https://instagram.com/faculdade.teste" }], about: "Sobre a faculdade.", logo: null, cover: null, active: true, deactivatedAt: null },
  minGroupSize: 5,
};
/** Student: only their class. */
const base: InstitutionPageData = {
  ...header,
  viewer: { level: "student", canEdit: false, canChangeStatus: false, canChangeComponents: false },
  myClass: { id: "k1", name: "A", course: "Computação", disciplines: [{ id: "d1", name: "Lógica", professors: ["Ana Souza"] }, { id: "d2", name: "Algoritmos", professors: [] }], classmates: ["Bruno Lima", "Carla Dias"] },
};
/** Professor: only the classes taught. */
const professorView: InstitutionPageData = {
  ...header,
  viewer: { level: "professor", canEdit: false, canChangeStatus: false, canChangeComponents: false },
  teaching: {
    classes: [{ id: "k1", name: "A", course: "Computação", students: 2 }],
    disciplines: [
      { id: "d1", name: "Lógica", course: "Computação", classes: ["A"], students: [{ name: "Bruno Lima", className: "A" }, { name: "Carla Dias", className: "A" }], weeks: [{ week: "2026-11-09", active: 1 }, { week: "2026-11-16", active: 2 }] },
      { id: "d2", name: "Algoritmos", course: "Computação", classes: ["A"], students: [{ name: "Bruno Lima", className: "A" }], weeks: [{ week: "2026-11-09", active: 0 }, { week: "2026-11-16", active: 1 }] },
    ],
  },
};
/** Coordination: aggregated numbers of its courses; no editing. */
const staff: InstitutionPageData = {
  ...header,
  viewer: { level: "coordinator", canEdit: false, canChangeStatus: false, canChangeComponents: false },
  counts: { courses: 1, classes: 2, disciplines: 1 },
  overview: { students: 8, activeShare: 0.5, activeChange: 2, quizAccuracy: 0.62, chatSatisfaction: null, weeks: [{ week: "2026-11-09", active: 3 }, { week: "2026-11-16", active: 4 }], concepts: [{ concept: "input_output", score: 0.8, total: 12 }] },
  courses: [{ id: "c1", name: "Computação", classes: 2, disciplines: 1, students: 8, activeShare: 0.5 }],
  classes: [{ id: "k1", name: "A", course: "Computação", students: 6, activeShare: 0.5, quizAccuracy: 0.7 }, { id: "k2", name: "B", course: "Computação", students: null, activeShare: null, quizAccuracy: null }],
  disciplines: [{ id: "d1", name: "Lógica", course: "Computação", classes: 1, questions: 4, releasedExams: 1 }],
  team: { coordinators: 1, professors: 2, students: 8 },
};
/** Admin: the same for the whole institution, plus editing. */
const admin: InstitutionPageData = { ...staff, viewer: { level: "admin", canEdit: true, canChangeStatus: false, canChangeComponents: false }, overview: { ...staff.overview!, chatSatisfaction: 0.71 } };

const summary = (id: string, name: string, active = true) => ({ id, name, kind: "faculdade" as const, city: "Belém", state: "PA", logo: null, active, courses: 2, classes: 4 });

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/institution"]}><Routes><Route path="/institution" element={<InstitutionPage />} /></Routes></MemoryRouter>
  </QueryClientProvider>,
);

beforeEach(() => {
  chooseLanguage("pt-BR");
  vi.clearAllMocks();
  api.list.mockResolvedValue([summary("i1", "Faculdade Teste")]);
});

it("shows the student only their class: subjects with the professor and the classmates' names", async () => {
  api.page.mockResolvedValue(base);
  renderPage();
  expect(await screen.findByRole("heading", { name: "Faculdade Teste", level: 1 })).toBeInTheDocument();
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Minha turma", "Colegas2"]);
  expect(screen.getByText("Professor(a): Ana Souza")).toBeInTheDocument();
  expect(screen.getByText("Ainda sem professor(a) vinculado(a).")).toBeInTheDocument();
  expect(screen.queryByText("alunos")).not.toBeInTheDocument();
  expect(screen.queryByRole("list", { name: "Estrutura da instituição" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Localização" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar dados" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Colegas/ }));
  expect(screen.getByText("Bruno Lima")).toBeInTheDocument();
  expect(screen.getByText("Carla Dias")).toBeInTheDocument();
});

it("shows the professor their classes, students per subject and weekly activity per subject", async () => {
  api.page.mockResolvedValue(professorView);
  renderPage();
  expect(await screen.findByRole("heading", { name: "Turmas em que você dá aula" })).toBeInTheDocument();
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Minhas turmas", "Alunos2"]);
  expect(screen.getByRole("heading", { name: "Alunos ativos por semana · Lógica" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Disciplina"), { target: { value: "d2" } });
  expect(screen.getByRole("heading", { name: "Alunos ativos por semana · Algoritmos" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ver em tabela" }));
  expect(screen.getByRole("table", { name: "Alunos ativos por semana · Algoritmos" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /Alunos/ }));
  expect(screen.getByRole("table", { name: "Alunos de Lógica" })).toHaveTextContent("Carla Dias");
  expect(screen.queryByText("satisfação com o chat (30 dias)")).not.toBeInTheDocument();
});

it("moves between tabs with the arrow keys and hides the size of small groups", async () => {
  api.page.mockResolvedValue(staff);
  renderPage();
  const overview = await screen.findByRole("tab", { name: "Visão geral" });
  // Chat satisfaction covers the whole institution: admins only.
  expect(screen.queryByText("satisfação com o chat (30 dias)")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Editar dados" })).not.toBeInTheDocument();
  overview.focus();
  fireEvent.keyDown(overview, { key: "ArrowRight" });
  fireEvent.keyDown(screen.getByRole("tab", { name: /Cursos/ }), { key: "ArrowRight" });
  const classes = screen.getByRole("tab", { name: /Turmas/ });
  expect(classes).toHaveAttribute("aria-selected", "true");
  expect(classes).toHaveFocus();
  const rowB = within(screen.getByRole("table", { name: "Turmas" })).getByRole("row", { name: /^B/ });
  expect(rowB).toHaveTextContent("menos de 5");
  expect(rowB).toHaveTextContent("oculto");
  fireEvent.keyDown(classes, { key: "End" });
  expect(screen.getByRole("tab", { name: "Pessoas" })).toHaveFocus();
  expect(screen.getByText("na coordenação")).toBeInTheDocument();
});

it("lets the admin edit the details, reporting the fields the server refuses", async () => {
  api.page.mockResolvedValue(admin);
  expect(admin.viewer.canEdit).toBe(true);
  api.update.mockRejectedValue({ response: { data: { issues: [{ field: "website", code: "INVALID" }] } } });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Editar dados" }));
  const dialog = await screen.findByRole("dialog");
  const website = within(dialog).getByRole("textbox", { name: /^Site/ });
  fireEvent.change(website, { target: { value: "não é site" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(website).toHaveAttribute("aria-invalid", "true"));
  expect(website).toHaveAccessibleDescription(expect.stringContaining("Valor inválido."));
  expect(api.update).toHaveBeenCalledWith("i1", expect.objectContaining({ website: "não é site", kind: "faculdade" }), true);
});

it("asks the owner to confirm before turning the institution off", async () => {
  api.page.mockResolvedValue({ ...admin, viewer: { level: "admin", canEdit: true, canChangeStatus: true, canChangeComponents: true } });
  api.setStatus.mockResolvedValue({ active: false, deactivatedAt: "2026-11-19T10:00:00Z" });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Desativar instituição" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Nenhum dado é apagado.");
  fireEvent.click(within(dialog).getByRole("button", { name: "Desativar instituição" }));
  await waitFor(() => expect(api.setStatus).toHaveBeenCalledWith("i1", false));
});

it("lists every institution for admins and opens the chosen one; members go straight to theirs", async () => {
  api.list.mockResolvedValue([summary("i1", "Faculdade Teste"), summary("i2", "Escola Técnica", false), summary("i3", "Instituto Norte")]);
  api.page.mockResolvedValue(admin);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/institution"]}>
        <Routes><Route path="/institution" element={<InstitutionPage />} /><Route path="/institution/:institutionId" element={<InstitutionPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByRole("heading", { name: "Instituições", level: 1 })).toBeInTheDocument();
  expect(api.page).not.toHaveBeenCalled();
  expect(screen.getAllByRole("link")).toHaveLength(3);
  expect(screen.getByText("3 de 3 instituições")).toBeInTheDocument();
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar por nome ou cidade" }), { target: { value: "norte" } });
  expect(screen.getAllByRole("link")).toHaveLength(1);
  fireEvent.change(screen.getByRole("searchbox", { name: "Buscar por nome ou cidade" }), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Situação"), { target: { value: "inactive" } });
  expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([expect.stringContaining("Desativada")]);
  fireEvent.click(screen.getByRole("link", { name: /Escola Técnica/ }));
  expect(await screen.findByRole("link", { name: "Todas as instituições" })).toBeInTheDocument();
  await waitFor(() => expect(api.page).toHaveBeenCalledWith("i2"));
});


it("shows the address as text and the map right away", async () => {
  api.page.mockResolvedValue(base);
  renderPage();
  const card = await screen.findByRole("region", { name: "Localização" });
  expect(card).toHaveTextContent("Av. Exemplo, 100 – Guamá");
  expect(card).toHaveTextContent("Belém – PA · 66000-000");
  const frame = within(card).getByTitle("Mapa com a localização de Faculdade Teste");
  expect(frame.getAttribute("src")).toContain("openstreetmap.org/export/embed.html");
  expect(frame.getAttribute("src")).toContain("marker=-1.4558,-48.4902");
  expect(within(card).getByRole("link", { name: /Como chegar/ })).toHaveAttribute("href", "https://www.google.com/maps/dir/?api=1&destination=-1.4558%2C-48.4902");
  expect(within(card).getByRole("link", { name: /Abrir no Google Maps/ })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=-1.4558%2C-48.4902");
});

it("opens Google Maps by the address when there is no map point, and tells the admin how to add one", async () => {
  api.page.mockResolvedValue({ ...admin, institution: { ...admin.institution, address: null, addressNumber: null, district: null, postalCode: null, latitude: null, longitude: null } });
  renderPage();
  const card = await screen.findByRole("region", { name: "Localização" });
  expect(card.querySelector("iframe")).toBeNull();
  expect(within(card).getByRole("link", { name: /Abrir no Google Maps/ })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=Bel%C3%A9m%2C%20PA");
  expect(card).toHaveTextContent("marque o ponto em Editar dados");
});

it("finds the map point from the address and saves it with the details", async () => {
  api.page.mockResolvedValue({ ...admin, institution: { ...admin.institution, latitude: null, longitude: null } });
  api.geocode.mockResolvedValue([{ label: "Avenida Exemplo, Belém, Pará", latitude: -1.45, longitude: -48.49 }]);
  api.update.mockResolvedValue({ ok: true });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Editar dados" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Buscar pelo endereço" }));
  await waitFor(() => expect(api.geocode).toHaveBeenCalledWith("i1", "Av. Exemplo, 100, Guamá, Belém, PA, 66000-000"));
  const result = (await within(dialog).findByText("Avenida Exemplo, Belém, Pará")).closest("button")!;
  expect(result).toHaveTextContent("Usar este ponto: Avenida Exemplo");
  fireEvent.click(result);
  expect(within(dialog).getByRole("textbox", { name: /^Latitude/ })).toHaveValue("-1.45");
  expect(within(dialog).getByRole("link", { name: /Conferir no mapa/ })).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledWith("i1", expect.objectContaining({ latitude: "-1.45", longitude: "-48.49", address: "Av. Exemplo", addressNumber: "100" }), true));
});

it("hides the location and the profile photo where the owner turned them off", async () => {
  api.page.mockResolvedValue({ ...admin, components: { location: false, photo: false }, institution: { ...admin.institution, city: null, state: null, address: null, addressNumber: null, district: null, postalCode: null, latitude: null, longitude: null } });
  api.update.mockResolvedValue({ ok: true });
  renderPage();
  await screen.findByRole("heading", { name: "Faculdade Teste", level: 1 });
  expect(screen.queryByRole("region", { name: "Localização" })).not.toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Componentes da página" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Foto e capa" }));
  let dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByLabelText(/Foto de perfil/)).not.toBeInTheDocument();
  expect(within(dialog).getByLabelText("Capa")).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: "Editar dados" }));
  dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("group", { name: "Localização" })).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledWith("i1", expect.anything(), false));
});

it("lets the owner switch the page components of the institution", async () => {
  api.page.mockResolvedValue({ ...admin, viewer: { level: "admin", canEdit: true, canChangeStatus: true, canChangeComponents: true } });
  vi.mocked(featuresApi.setRule).mockResolvedValue({} as never);
  renderPage();
  const section = await screen.findByRole("region", { name: "Componentes da página" });
  const photo = within(section).getByRole("switch", { name: "Foto de perfil" });
  expect(photo).toHaveAttribute("aria-checked", "true");
  fireEvent.click(photo);
  await waitFor(() => expect(featuresApi.setRule).toHaveBeenCalledWith({ feature: "institution_photo", scope: "institution", scopeId: "i1", enabled: false }));
});

it("fills street, city and state from a CEP with 8 digits", async () => {
  api.page.mockResolvedValue({ ...admin, institution: { ...admin.institution, address: null, addressNumber: null, district: null, postalCode: null, city: null, state: null } });
  api.postalCode.mockResolvedValue({ postalCode: "66075-110", address: "Rua Augusto Corrêa", district: "Guamá", city: "Belém", state: "PA", country: "Brasil" });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Editar dados" }));
  const dialog = await screen.findByRole("dialog");
  const cep = within(dialog).getByRole("textbox", { name: /^CEP/ });
  fireEvent.change(cep, { target: { value: "6607" } });
  expect(api.postalCode).not.toHaveBeenCalled();
  fireEvent.change(cep, { target: { value: "66075110" } });
  await waitFor(() => expect(api.postalCode).toHaveBeenCalledWith("i1", "66075110"));
  await waitFor(() => expect(within(dialog).getByRole("textbox", { name: /^Cidade/ })).toHaveValue("Belém"));
  expect(within(dialog).getByRole("textbox", { name: /^Endereço(?! do link)/ })).toHaveValue("Rua Augusto Corrêa");
  expect(within(dialog).getByRole("textbox", { name: /^Bairro/ })).toHaveValue("Guamá");
  expect(within(dialog).getByRole("textbox", { name: /^Estado/ })).toHaveValue("PA");
  expect(cep).toHaveValue("66075-110");
  expect(dialog).toHaveTextContent("Endereço preenchido pelo CEP.");
});

it("shows the institution's networks and lets the admin add, change and remove links", async () => {
  api.page.mockResolvedValue(admin);
  api.update.mockResolvedValue({ ok: true });
  renderPage();
  const networks = await screen.findByRole("list", { name: "Redes e outros sites" });
  expect(within(networks).getByRole("link", { name: /Instagram/ })).toHaveAttribute("href", "https://instagram.com/faculdade.teste");
  fireEvent.click(screen.getByRole("button", { name: "Editar dados" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Adicionar link" }));
  fireEvent.change(within(dialog).getByLabelText("Tipo do link 2"), { target: { value: "facebook" } });
  fireEvent.change(within(dialog).getByRole("textbox", { name: /^Endereço do link 2/ }), { target: { value: "facebook.com/faculdadeteste" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Remover link 1" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.update).toHaveBeenCalledWith("i1", expect.objectContaining({ links: [{ kind: "facebook", url: "facebook.com/faculdadeteste" }] }), true));
});

it("frames a chosen cover before saving and refuses originals that are too big", async () => {
  api.page.mockResolvedValue(admin);
  api.setImage.mockResolvedValue({ ok: true });
  renderPage();
  fireEvent.click(await screen.findByRole("button", { name: "Foto e capa" }));
  const dialog = await screen.findByRole("dialog");
  const input = within(dialog).getByLabelText("Capa") as HTMLInputElement;
  const big = new File(["x"], "grande.png", { type: "image/png" });
  Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
  fireEvent.change(input, { target: { files: [big] } });
  expect(await within(dialog).findByText("Escolha uma imagem de até 10 MB.")).toBeInTheDocument();
  fireEvent.change(input, { target: { files: [new File(["png"], "capa.png", { type: "image/png" })] } });
  expect(await within(dialog).findByRole("group", { name: "Enquadramento da capa" })).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Centralizar" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(api.setImage).toHaveBeenCalledWith("i1", "cover", "data:image/webp;base64,UklGRg=="));
  expect(vi.mocked(renderCrop)).toHaveBeenCalledWith(expect.any(String), 4, { x: 0.5, y: 0.5, zoom: 1 }, 1600, 1536 * 1024);
});
