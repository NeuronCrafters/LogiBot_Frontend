import { http, HttpResponse } from "msw";
import {
  gradeAttempt,
  linkedDisciplineIdsByQuizId,
  professorQuizById,
  professorQuizResults,
  professorQuizzes,
  quizHistory,
  questionsByQuizId,
  studentQuizHub,
} from "../fixtures/quizzes";

function fakeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const quizHandlers = [
  // ── Professor ────────────────────────────────────────────────────────────────
  http.get("*/quiz/professor", () => HttpResponse.json(professorQuizzes)),

  http.post("*/quiz/professor", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: fakeId("quiz"),
        disciplines: [],
        disciplineName: "",
        questionCount: 0,
        status: "draft",
        createdAt: new Date().toISOString(),
        ...body,
      },
      { status: 201 },
    );
  }),

  http.put("*/quiz/professor/:id", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const existing = professorQuizById[params.id as string];
    return HttpResponse.json({ ...existing, ...body });
  }),

  http.delete("*/quiz/professor/:id", () => HttpResponse.json({ success: true })),

  http.get("*/quiz/professor/:quizId/disciplines", ({ params }) =>
    HttpResponse.json({
      disciplineIds: linkedDisciplineIdsByQuizId[params.quizId as string] ?? [],
    }),
  ),
  http.post("*/quiz/professor/:quizId/disciplines", () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete("*/quiz/professor/:quizId/disciplines/:disciplineId", () =>
    HttpResponse.json({ success: true }),
  ),

  http.post("*/quiz/professor/:id/publish", ({ params }) => {
    const quiz = professorQuizById[params.id as string];
    return HttpResponse.json({ ...quiz, status: "published" });
  }),
  http.post("*/quiz/professor/:id/unpublish", ({ params }) => {
    const quiz = professorQuizById[params.id as string];
    return HttpResponse.json({ ...quiz, status: "draft" });
  }),

  http.get("*/quiz/professor/:quizId/questions", ({ params }) =>
    HttpResponse.json(questionsByQuizId[params.quizId as string] ?? []),
  ),
  http.post("*/quiz/professor/:quizId/questions", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({ id: fakeId("question"), ...body }, { status: 201 });
  }),
  http.delete("*/quiz/professor/:quizId/questions/:questionId", () =>
    HttpResponse.json({ success: true }),
  ),

  http.get("*/quiz/professor/:quizId/results", ({ params }) =>
    HttpResponse.json(
      professorQuizResults[params.quizId as string] ?? {
        quiz: { id: params.quizId as string, title: "", topic: "" },
        attempts: [],
      },
    ),
  ),

  http.post("*/quiz/professor/generate-ai", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return HttpResponse.json({
      quiz: {
        id: fakeId("quiz"),
        title: body.title ?? "Quiz gerado por IA",
        topic: body.theme ?? "variaveis",
        description: "Gerado automaticamente a partir do material selecionado.",
        disciplineId: body.disciplineId ?? "",
        disciplineName: "",
        disciplines: [],
        generationSource: "ai",
        questionCount: 0,
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      questions: [],
      sourceSummary: { documentCount: 1, retrievedChunkCount: 4 },
    });
  }),

  // ── Aluno ────────────────────────────────────────────────────────────────────
  http.get("*/quiz/student/hub", () => HttpResponse.json(studentQuizHub)),

  http.get("*/quiz/student/:id", ({ params }) => {
    const quizId = params.id as string;
    const quiz = professorQuizById[quizId];
    const questions = (questionsByQuizId[quizId] ?? []).map(
      ({ id, question, options, orderIndex }) => ({ id, question, options, orderIndex }),
    );
    if (!quiz) return new HttpResponse(null, { status: 404 });
    const { questionCount: _questionCount, ...rest } = quiz;
    return HttpResponse.json({ ...rest, questions });
  }),

  http.post("*/quiz/student/:id/attempt", async ({ params, request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      answers?: Record<string, string>;
    };
    return HttpResponse.json(
      gradeAttempt(params.id as string, body.answers ?? {}),
    );
  }),

  // ── Histórico (compartilhado por chat sidebar e página de quiz) ──────────────
  http.get("*/quiz/history/:userId", () => HttpResponse.json(quizHistory)),
];
