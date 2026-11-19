/**
 * Sections rendered inside the app layout: only their content fades, the side menu stays.
 * Every new section of the layout must be listed here (a test compares it with the router).
 */
export const APP_LAYOUT_SECTIONS = ["home", "chat", "quiz", "practice", "questions", "exams", "dashboard", "concepts", "entities", "profile", "feedback", "admin", "rag", "dev"];
const APP_LAYOUT_PATH = new RegExp(`^/(?:${APP_LAYOUT_SECTIONS.join("|")})(?:/|$)`);
export const isAppLayoutPath = (pathname: string) => APP_LAYOUT_PATH.test(pathname);
