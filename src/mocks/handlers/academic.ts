import { http, HttpResponse } from "msw";
import {
  academicDataResponse,
  allProfessors,
  allStudents,
  classA,
  classB,
} from "../fixtures/academic";

function fakeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  return (await request.json().catch(() => ({}))) as Record<string, unknown>;
}

const classesById: Record<string, typeof classA> = {
  [classA._id]: classA,
  [classB._id]: classB,
};

export const academicHandlers = [
  http.get("*/academic/filters", () => HttpResponse.json(academicDataResponse)),

  // ── Admin listings usadas por Entidades ────────────────────────────────────
  http.get("*/admin/students", () => HttpResponse.json(allStudents)),

  http.get("*/admin/classes/:classId/students", ({ params }) => {
    const cls = classesById[params.classId as string];
    const students = (cls?.students ?? allStudents).map((s) => ({
      ...s,
      id: s._id,
      code: s.email,
    }));
    return HttpResponse.json(students);
  }),

  http.get("*/admin/professors", () => HttpResponse.json(allProfessors)),
  http.get("*/admin/universities/:schoolId/professors", () =>
    HttpResponse.json(allProfessors),
  ),
  http.get("*/admin/courses/:courseId/professors", () =>
    HttpResponse.json(allProfessors),
  ),

  http.post("*/admin/professors", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as object;
    return HttpResponse.json(
      { _id: fakeId("prof"), role: ["professor"], ...body },
      { status: 201 },
    );
  }),
  http.delete("*/admin/professors/:professorId", () =>
    HttpResponse.json({ success: true }),
  ),
  http.patch("*/admin/professors/:id/role", () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete("*/admin/students/:studentId", () =>
    HttpResponse.json({ success: true }),
  ),

  // ── CRUD genérico de entidades acadêmicas (universidade/curso/turma/disciplina) ──
  http.post("*/academic/universities", async ({ request }) =>
    HttpResponse.json({ _id: fakeId("uni"), ...(await readBody(request)) }, { status: 201 }),
  ),
  http.post("*/academic/courses", async ({ request }) =>
    HttpResponse.json({ _id: fakeId("course"), ...(await readBody(request)) }, { status: 201 }),
  ),
  http.post("*/academic/classes", async ({ request }) =>
    HttpResponse.json(
      {
        _id: fakeId("class"),
        registrationCode: `LOGI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        ...(await readBody(request)),
      },
      { status: 201 },
    ),
  ),
  http.post("*/academic/disciplines", async ({ request }) =>
    HttpResponse.json({ _id: fakeId("disc"), ...(await readBody(request)) }, { status: 201 }),
  ),

  http.patch("*/academic/universities/:id", () => HttpResponse.json({ success: true })),
  http.patch("*/academic/courses/:id", () => HttpResponse.json({ success: true })),
  http.patch("*/academic/classes/:id", () => HttpResponse.json({ success: true })),
  http.patch("*/academic/disciplines/:id", () => HttpResponse.json({ success: true })),

  http.delete("*/academic/universities/:id", () => HttpResponse.json({ success: true })),
  http.delete("*/academic/courses/:id", () => HttpResponse.json({ success: true })),
  http.delete("*/academic/classes/:id", () => HttpResponse.json({ success: true })),
  http.delete("*/academic/disciplines/:id", () => HttpResponse.json({ success: true })),

  // ── Vínculos ────────────────────────────────────────────────────────────────
  http.post("*/academic/disciplines/:disciplineId/professors", () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete("*/academic/disciplines/:disciplineId/professors/:professorId", () =>
    HttpResponse.json({ success: true }),
  ),
  http.post("*/academic/classes/:classId/disciplines", () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete("*/academic/classes/:classId/disciplines/:disciplineId", () =>
    HttpResponse.json({ success: true }),
  ),
  http.patch("*/academic/classes/:classId/registration-code", () =>
    HttpResponse.json({
      registrationCode: `LOGI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    }),
  ),
  http.post("*/academic/classes/:classId/students", () =>
    HttpResponse.json({ success: true }),
  ),
  http.delete("*/academic/classes/:classId/students/:studentId", () =>
    HttpResponse.json({ success: true }),
  ),

  // ── Coordenador (não usado pelas 2 personas mockadas, stub inofensivo) ───────
  http.get("*/admin/coordinator/*", () => HttpResponse.json([])),
  http.get("*/admin/professor-students", () => HttpResponse.json([])),
];
