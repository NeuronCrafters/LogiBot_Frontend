import { describe, expect, it, vi, afterEach } from "vitest";
import { api, publicApi } from "@/shared/api/httpClient";
import { chooseLanguage } from "..";
import { chatApi } from "@/features/chat/api/chatApi";
import { apiError } from "@/shared/lib/apiError";

afterEach(()=>vi.unstubAllGlobals());

describe("transporte de idiomas",()=>{
  it("lê a escolha atual em ambos os clientes Axios e preserva cabeçalhos congelados",async()=>{
    const seen: unknown[]=[];
    const adapter=async(config:any)=>{seen.push(config.headers.toJSON());return {data:{},status:200,statusText:"OK",headers:{},config};};
    chooseLanguage("en-US");await api.get("/test",{adapter});
    chooseLanguage("es-ES");await publicApi.get("/test",{adapter});
    await api.get("/test",{adapter,headers:{"Accept-Language":"en-US","X-Language":"en-US"}});
    expect(seen[0]).toMatchObject({"Accept-Language":"en-US","X-Language":"en-US"});
    expect(seen[1]).toMatchObject({"Accept-Language":"es-ES","X-Language":"es-ES"});
    expect(seen[2]).toMatchObject({"Accept-Language":"en-US","X-Language":"en-US"});
  });
  it("envia o idioma pelo fetch SSE, preserva a pergunta e processa tokens UTF-8 fragmentados",async()=>{
    chooseLanguage("en-US");
    const streamText='event: session\ndata: {"sessionId":"session","userMessageId":"user"}\n\nevent: token\ndata: {"text":"Olá João"}\n\nevent: done\ndata: {"provider":"openrouter"}\n\n';
    const bytes=new TextEncoder().encode(streamText);
    const fetchMock=vi.fn().mockResolvedValue({ok:true,body:new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(Uint8Array.of(byte));controller.close();}})});
    vi.stubGlobal("fetch",fetchMock);
    const tokens:string[]=[];
    await chatApi.streamTutor("Pergunta original em português",undefined,{onToken:token=>tokens.push(token)});
    const options=fetchMock.mock.calls[0][1];
    expect(options.headers).toMatchObject({"Accept-Language":"en-US","X-Language":"en-US"});
    expect(JSON.parse(options.body).message).toBe("Pergunta original em português");
    expect(tokens.join("")).toBe("Olá João");
  });
  it("localiza falhas de rede e evita mensagem de resposta antiga em outro idioma",()=>{
    chooseLanguage("en-US");
    expect(apiError({code:"ERR_NETWORK"})).toContain("Could not connect");
    expect(apiError({response:{data:{message:"Erro antigo"},headers:{"content-language":"pt-BR"}}})).not.toContain("Erro antigo");
    expect(apiError({response:{data:{message:"A specific error"},headers:{"content-language":"en-US"}}})).toBe("A specific error");
  });
});
