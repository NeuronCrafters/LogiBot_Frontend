import type { User } from "@/app/providers/AuthContext";
import {
  CLASS_A_ID,
  CLASS_B_ID,
  COURSE_ID,
  DISC_ESTRUTURAS_ID,
  DISC_LOGICA_ID,
  STAFF_USER_ID,
  STUDENT_USER_ID,
  UNIVERSITY_ID,
} from "./ids";

export const STUDENT_EMAIL = "student@logibot.dev";
export const STAFF_EMAIL = "admin@logibot.dev";
export const MOCK_PASSWORD = "logibot123";

export const studentUser: User = {
  _id: STUDENT_USER_ID,
  name: "Ana Beatriz Souza",
  email: STUDENT_EMAIL,
  role: ["student"],
  school: "Federal University of Technology",
  schoolId: UNIVERSITY_ID,
  schoolName: "Federal University of Technology",
  course: "Software Engineering",
  courses: [COURSE_ID],
  courseId: COURSE_ID,
  courseName: "Software Engineering",
  class: CLASS_A_ID,
  classes: [CLASS_A_ID],
  className: "Class A - Programming Logic 2026.1",
  classId: CLASS_A_ID,
  disciplines: [DISC_LOGICA_ID, DISC_ESTRUTURAS_ID],
};

export const staffUser: User = {
  _id: STAFF_USER_ID,
  name: "Marcus Teixeira",
  email: STAFF_EMAIL,
  role: ["admin"],
  school: "Federal University of Technology",
  schoolId: UNIVERSITY_ID,
  schoolName: "Federal University of Technology",
  courses: [COURSE_ID],
  courseId: COURSE_ID,
  courseName: "Software Engineering",
  classes: [CLASS_A_ID, CLASS_B_ID],
  className: [
    "Class A - Programming Logic 2026.1",
    "Class B - Programming Logic 2026.1",
  ],
  classId: [CLASS_A_ID, CLASS_B_ID],
  disciplines: [
    { id: DISC_LOGICA_ID, _id: DISC_LOGICA_ID, name: "Programming Logic" },
    { id: DISC_ESTRUTURAS_ID, _id: DISC_ESTRUTURAS_ID, name: "Data Structures" },
  ],
};

export const usersByEmail: Record<string, User> = {
  [STUDENT_EMAIL]: studentUser,
  [STAFF_EMAIL]: staffUser,
};

export const usersById: Record<string, User> = {
  [STUDENT_USER_ID]: studentUser,
  [STAFF_USER_ID]: staffUser,
};
