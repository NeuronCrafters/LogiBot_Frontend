import { http, HttpResponse } from "msw";
import {
  pickRagTestChatResponse,
  ragClasses,
  ragDocumentsByClassId,
  ragSettingsByClassId,
} from "../fixtures/rag";

function fakeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ragHandlers = [
  http.get("*/rag/classes", () => HttpResponse.json({ classes: ragClasses })),

  http.get("*/rag/classes/:classId/settings", ({ params }) => {
    const settings = ragSettingsByClassId[params.classId as string];
    return settings
      ? HttpResponse.json(settings)
      : new HttpResponse(null, { status: 404 });
  }),

  http.patch("*/rag/classes/:classId/settings", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const current = ragSettingsByClassId[params.classId as string];
    return HttpResponse.json({ ...current, ...body });
  }),

  http.get("*/rag/classes/:classId/documents", ({ params }) => {
    const documents = ragDocumentsByClassId[params.classId as string] ?? [];
    return HttpResponse.json({ documents });
  }),

  http.post("*/rag/classes/:classId/documents", ({ params }) =>
    HttpResponse.json(
      {
        id: fakeId("doc"),
        classId: params.classId,
        title: "Novo documento",
        status: "processing",
        enabled: true,
        isOwner: true,
      },
      { status: 201 },
    ),
  ),

  http.delete("*/rag/classes/:classId/documents/:documentId", () =>
    HttpResponse.json({ success: true }),
  ),

  http.patch("*/rag/classes/:classId/documents/:documentId", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({ success: true, ...body });
  }),

  http.post("*/rag/documents/:documentId/classes", () =>
    HttpResponse.json({ success: true }),
  ),
  http.get("*/rag/documents/:documentId/classes", () =>
    HttpResponse.json({ classIds: [] }),
  ),
  http.post("*/rag/documents/:documentId/reprocess", () =>
    HttpResponse.json({ success: true }),
  ),

  http.post("*/rag/classes/:classId/test-chat", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { message?: string };
    return HttpResponse.json(pickRagTestChatResponse(body.message ?? ""));
  }),
];
