import { http, HttpResponse } from "msw";
import { usersByEmail } from "../fixtures/users";
import { clearCurrentUserId, getCurrentUser, setCurrentUserId } from "../session";

export const authHandlers = [
  http.post("*/auth/session", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const user = body.email ? usersByEmail[body.email] : undefined;
    if (!user) {
      return HttpResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }
    setCurrentUserId(user._id);
    return HttpResponse.json({ success: true });
  }),

  http.get("*/auth/me", () => {
    const user = getCurrentUser();
    if (!user) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(user);
  }),

  http.post("*/auth/logout", () => {
    clearCurrentUserId();
    return HttpResponse.json({ success: true });
  }),

  http.post("*/auth/register", () => HttpResponse.json({ success: true })),
];
