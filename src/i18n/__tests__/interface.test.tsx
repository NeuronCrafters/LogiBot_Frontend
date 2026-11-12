import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "@/app/providers/AuthContext";
import { Home } from "@/features/home/pages/HomePage";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { chooseLanguage, t } from "..";
import { QUIZ_TOPICS } from "@/features/quiz/types";
import { AppModal } from "@/shared/components/feedback/AppModal";

const auth = {user:null,setUser:vi.fn(),isAuthenticated:false,loading:false,login:vi.fn(),logout:vi.fn(),getUser:vi.fn()};
const wrapper=({children}:{children:React.ReactNode})=><BrowserRouter><AuthContext.Provider value={auth}>{children}</AuthContext.Provider></BrowserRouter>;
beforeEach(()=>{act(()=>chooseLanguage("pt-BR"));});

describe("interface reativa e preservação",()=>{
  it("traduz a página inicial e o idioma do documento sem recarregar",async()=>{
    const user=userEvent.setup();render(<Home/>,{wrapper});
    expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Aprenda, pratique");
    await user.selectOptions(screen.getByRole("combobox",{name:"Idioma"}),"en-US");
    expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Learn, practice");
    expect(document.documentElement.lang).toBe("en-US");
    await user.selectOptions(screen.getByRole("combobox",{name:"Language"}),"es-ES");
    expect(screen.getByRole("heading",{level:1})).toHaveTextContent("Aprende, practica");
    expect(document.documentElement.lang).toBe("es-ES");
  });
  it("preserva os campos do cadastro e a senha ao trocar o idioma",async()=>{
    const user=userEvent.setup();render(<AuthPage mode="signup"/>,{wrapper});
    await user.type(screen.getByLabelText("Nome completo"),"João da Silva");
    await user.type(screen.getByLabelText("E-mail"),"joao@example.invalid");
    await user.type(screen.getByLabelText("Senha"),"senha-original-123");
    await user.type(screen.getByLabelText("Código de acesso"),"TURMA-739");
    await user.selectOptions(screen.getByRole("combobox",{name:"Idioma"}),"en-US");
    expect(screen.getByLabelText("Full name")).toHaveValue("João da Silva");
    expect(screen.getByLabelText("Email")).toHaveValue("joao@example.invalid");
    expect(screen.getByLabelText("Password")).toHaveValue("senha-original-123");
    expect(screen.getByLabelText("Access code")).toHaveValue("TURMA-739");
  });
  it("atualiza rótulos de assuntos sem mudar seus códigos",()=>{
    const codes=QUIZ_TOPICS.map(item=>item.value);
    act(()=>chooseLanguage("en-US"));expect(QUIZ_TOPICS[3].label).toBe("Functions");
    act(()=>chooseLanguage("es-ES"));expect(QUIZ_TOPICS[3].label).toBe("Funciones");
    expect(QUIZ_TOPICS.map(item=>item.value)).toEqual(codes);
  });
  it("mantém o conteúdo e o foco do modal enquanto traduz ações e permite Escape",async()=>{
    const user=userEvent.setup(),close=vi.fn();
    render(<AppModal isOpen type="info" title="Título original do documento" onClose={close}><input aria-label="original" defaultValue="Conteúdo cadastrado"/></AppModal>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(()=>chooseLanguage("en-US"));
    expect(screen.getByDisplayValue("Conteúdo cadastrado")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Título original do documento");
    expect(screen.getAllByRole("button",{name:t("common.fechar")})).not.toHaveLength(0);
    await user.keyboard("{Escape}");expect(close).toHaveBeenCalledTimes(1);
  });
});
