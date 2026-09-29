import { academicHandlers } from "./academic";
import { accountHandlers } from "./account";
import { authHandlers } from "./auth";
import { chatHandlers } from "./chat";
import { dashboardHandlers } from "./dashboard";
import { quizHandlers } from "./quiz";
import { ragHandlers } from "./rag";

export const handlers = [
  ...authHandlers,
  ...academicHandlers,
  ...quizHandlers,
  ...chatHandlers,
  ...ragHandlers,
  ...dashboardHandlers,
  ...accountHandlers,
];
