/** Only the student role (staff may also be students in some accounts: they use the management side). */
export const isStudentOnly = (role: unknown) => {
  const roles = Array.isArray(role) ? role : role ? [role] : [];
  return roles.length > 0 && roles.every((item) => item === "student");
};
