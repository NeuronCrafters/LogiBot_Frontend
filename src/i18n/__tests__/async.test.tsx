import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthContext, type User } from "@/app/providers/AuthContext";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { LanguagePreferenceSync } from "../LanguagePreferenceSync";
import { chooseLanguage } from "..";
import { api } from "@/shared/api/httpClient";
import { DashboardInsightProvider, useDashboardInsights } from "@/features/dashboard/components/DashboardInsightProvider";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";

const account = {_id:"student",name:"Nome original",email:"student@example.invalid",role:["student"],preferredLanguage:null,school:"",schoolId:"",schoolName:""} as User;
function AccountHarness(){
 const [user,setUser]=useState<User|null>(account);
 return <BrowserRouter><AuthContext.Provider value={{user,setUser,isAuthenticated:true,loading:false,login:vi.fn(),logout:vi.fn(),getUser:vi.fn()}}><LanguagePreferenceSync/><LanguageSwitcher details/></AuthContext.Provider></BrowserRouter>;
}
function OpenInsight(){const {openChart}=useDashboardInsights();return <button onClick={()=>openChart("usage","Título anterior",{universityId:"university"})}>Open</button>;}
beforeEach(()=>{act(()=>chooseLanguage("en-US"));});

describe("preferências e concorrência",()=>{
 it("salva a preferência da conta e envia null ao seguir o navegador",async()=>{
  const patch=vi.spyOn(api,"patch").mockImplementation(async(_url,data:any)=>({data:{preferredLanguage:data.language}}));
  const user=userEvent.setup();render(<AccountHarness/>);
  await waitFor(()=>expect(screen.getByText("Preference saved to your account.")).toBeInTheDocument());
  await user.selectOptions(screen.getByRole("combobox"),"es-ES");
  await waitFor(()=>expect(screen.getByText("Preferencia guardada en tu cuenta.")).toBeInTheDocument());
  expect(patch).toHaveBeenLastCalledWith("/account/preferences",{language:"es-ES"});
  await user.selectOptions(screen.getByRole("combobox"),"system");
  await waitFor(()=>expect(patch).toHaveBeenLastCalledWith("/account/preferences",{language:null}));
 });
 it("mostra falha de persistência e mantém a escolha local",async()=>{
  vi.spyOn(api,"patch").mockRejectedValue(new Error("offline"));
  render(<AccountHarness/>);
  await waitFor(()=>expect(screen.getByText(/Could not save to your account/)).toBeInTheDocument());
  expect(screen.getByRole("combobox")).toHaveValue("en-US");
  expect(localStorage.getItem("logibot.language")).toContain("en-US");
 });
 it("separa cache de insights, ignora resposta antiga e reutiliza o idioma anterior",async()=>{
  const pending:Record<string,(value:any)=>void>={};
  const agent=vi.spyOn(dashboardApi,"getChartInsight").mockImplementation((_chart,_filters,_force,language)=>new Promise(resolve=>{pending[language!]=resolve;}));
  const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
  render(<QueryClientProvider client={client}><DashboardInsightProvider><OpenInsight/></DashboardInsightProvider></QueryClientProvider>);
  await userEvent.click(screen.getByRole("button",{name:"Open"}));
  await waitFor(()=>expect(pending["en-US"]).toBeDefined());
  act(()=>chooseLanguage("es-ES"));
  await waitFor(()=>expect(pending["es-ES"]).toBeDefined());
  await act(async()=>{pending["es-ES"]({data:{insight:"Resultado español actual",language:"es-ES",generatedAt:"now",cached:false}});});
  expect(screen.getByText("Resultado español actual")).toBeInTheDocument();
  await act(async()=>{pending["en-US"]({data:{insight:"Previous English result",language:"en-US",generatedAt:"now",cached:false}});});
  expect(screen.queryByText("Previous English result")).not.toBeInTheDocument();
  expect(screen.getByText("Resultado español actual")).toBeInTheDocument();
  act(()=>chooseLanguage("en-US"));
  await waitFor(()=>expect(screen.getByText("Previous English result")).toBeInTheDocument());
  expect(agent).toHaveBeenCalledTimes(2);
  expect(client.getQueryCache().getAll()).toHaveLength(2);
 });
});
