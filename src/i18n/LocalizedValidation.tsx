import { useEffect, useRef } from "react";
import { t, useLocale } from ".";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export function LocalizedValidation() {
  const locale = useLocale();
  const managed = useRef(new Set<Field>());
  useEffect(() => {
    const invalid = (event: Event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (managed.current.has(field)) field.setCustomValidity("");
      const validity = field.validity;
      const message = validity.valueMissing ? t("validation.required") : validity.typeMismatch && field instanceof HTMLInputElement && field.type === "email" ? t("validation.email") : validity.tooShort ? t("validation.minLength", { value: field.getAttribute("minlength") }) : validity.tooLong ? t("validation.maxLength", { value: field.getAttribute("maxlength") }) : validity.rangeUnderflow ? t("validation.min", { value: field.getAttribute("min") }) : validity.rangeOverflow ? t("validation.max", { value: field.getAttribute("max") }) : t("validation.invalid");
      field.setCustomValidity(message);
      managed.current.add(field);
    };
    const input = (event: Event) => {
      const field = event.target as Field;
      if (managed.current.has(field)) { field.setCustomValidity(""); managed.current.delete(field); }
    };
    const fields = managed.current;
    fields.forEach(field => field.setCustomValidity(""));
    fields.clear();
    document.addEventListener("invalid", invalid, true);
    document.addEventListener("input", input, true);
    document.addEventListener("change", input, true);
    return () => { document.removeEventListener("invalid", invalid, true); document.removeEventListener("input", input, true); document.removeEventListener("change", input, true); };
  }, [locale]);
  return null;
}
