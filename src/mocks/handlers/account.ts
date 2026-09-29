import { http, HttpResponse } from "msw";
import { getCurrentUser } from "../session";

export const accountHandlers = [
  http.patch("*/account/name", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return HttpResponse.json({ user: { ...getCurrentUser(), name: body.name } });
  }),

  http.patch("*/account/email", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    return HttpResponse.json({ user: { ...getCurrentUser(), email: body.email } });
  }),

  http.patch("*/account/password", () =>
    HttpResponse.json({ success: true }),
  ),
];
