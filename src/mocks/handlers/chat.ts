import { http, HttpResponse } from "msw";
import { CANNED_BOT_REPLY, chatHistoryBySession, chatSessions } from "../fixtures/chat";

function fakeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function sseStream(
  events: Array<{ event: string; data: unknown }>,
  delayMs = 35,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;
  return new ReadableStream({
    start(controller) {
      function pushNext() {
        if (index >= events.length) {
          controller.close();
          return;
        }
        const { event, data } = events[index++];
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
        setTimeout(pushNext, delayMs);
      }
      pushNext();
    },
  });
}

export const chatHandlers = [
  http.get("*/chat/sessions/:userId", () => HttpResponse.json(chatSessions)),

  http.get("*/chat/sessions/:userId/:sessionId/messages", ({ params }) => {
    const detail = chatHistoryBySession[params.sessionId as string];
    if (!detail) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(detail.messages);
  }),

  http.post("*/chat/messages/stream", () => {
    const sessionId = fakeId("session");
    const userMessageId = fakeId("msg");
    const words = CANNED_BOT_REPLY.split(" ");
    const tokenEvents = words.map((word, i) => ({
      event: "token",
      data: { text: i === 0 ? word : ` ${word}` },
    }));
    const events = [
      { event: "session", data: { sessionId, userMessageId } },
      { event: "status", data: { stage: "history" } },
      { event: "status", data: { stage: "rag" } },
      { event: "status", data: { stage: "agent" } },
      ...tokenEvents,
      {
        event: "done",
        data: { provider: "openai/gpt-4o-mini", timingsMs: { total: 900 } },
      },
    ];
    return new HttpResponse(sseStream(events), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }),

  http.post("*/chat/messages", () =>
    HttpResponse.json({
      status: "queued",
      jobId: fakeId("job"),
      sessionId: fakeId("session"),
      userMessageId: fakeId("msg"),
    }),
  ),

  http.post("*/analytics/interaction", () => HttpResponse.json({ success: true })),
  http.post("*/analytics/subject-clicks", () => HttpResponse.json({ success: true })),
];
